// Модуль для работы с состоянием тренировки
import { trainingStateApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, unlockCourtPlayers } from './trainings-court.js';
import { addPlayerToQueue } from './trainings-players.js';

// Функция для сохранения текущего состояния тренировки
export async function saveTrainingState() {
    try {
        console.log('Сохранение текущего состояния тренировки');

        // Получаем ID текущей тренировки
        const trainingId = sessionStorage.getItem('currentTrainingId');
        if (!trainingId) {
            console.error('Не найден ID текущей тренировки');
            return;
        }

        // Получаем текущую очередь игроков
        let playersQueue = [];
        const queueJson = sessionStorage.getItem('playersQueue');
        if (queueJson) {
            try {
                playersQueue = JSON.parse(queueJson);
            } catch (e) {
                console.error('Ошибка при парсинге очереди игроков:', e);
            }
        }

        // Получаем текущий режим тренировки
        const trainingModeSelect = document.getElementById('training-mode');
        const trainingMode = trainingModeSelect ? trainingModeSelect.value : 'single';

        // Собираем данные о кортах и игроках на них
        const courts = [];
        const courtElements = document.querySelectorAll('.court-container');

        courtElements.forEach(courtElement => {
            const courtId = courtElement.getAttribute('data-court-id');
            const isGameInProgress = courtElement.classList.contains('game-in-progress');

            // Получаем игроков на верхней половине корта
            const topHalf = courtElement.querySelector('.court-half[data-half="top"]');
            const topPlayers = Array.from(topHalf.querySelectorAll('.court-player'))
                .map(playerElement => {
                    return {
                        id: playerElement.getAttribute('data-player-id'),
                        name: playerElement.querySelector('.court-player-name').textContent,
                        photo: playerElement.querySelector('.court-player-photo').src
                    };
                });

            // Получаем игроков на нижней половине корта
            const bottomHalf = courtElement.querySelector('.court-half[data-half="bottom"]');
            const bottomPlayers = Array.from(bottomHalf.querySelectorAll('.court-player'))
                .map(playerElement => {
                    return {
                        id: playerElement.getAttribute('data-player-id'),
                        name: playerElement.querySelector('.court-player-name').textContent,
                        photo: playerElement.querySelector('.court-player-photo').src
                    };
                });

            // Получаем данные о таймере, если игра в процессе
            let gameStartTime = null;
            const startGameBtn = courtElement.querySelector('.start-game-btn');
            if (startGameBtn && startGameBtn.classList.contains('timer-active')) {
                gameStartTime = startGameBtn.getAttribute('data-start-time');
            }

            // Добавляем данные о корте
            courts.push({
                id: courtId,
                gameInProgress: isGameInProgress,
                topPlayers,
                bottomPlayers,
                gameStartTime
            });
        });

        // Формируем объект с данными состояния
        const stateData = {
            trainingId,
            trainingMode,
            playersQueue,
            courts,
            lastUpdated: new Date().toISOString()
        };

        // Сохраняем состояние в базе данных
        await trainingStateApi.saveTrainingState(trainingId, stateData);
        console.log('Состояние тренировки успешно сохранено');

        // Обновляем состояние в sessionStorage
        sessionStorage.setItem('trainingState', JSON.stringify(stateData));

        return true;
    } catch (error) {
        console.error('Ошибка при сохранении состояния тренировки:', error);
        showMessage('Не удалось сохранить состояние тренировки', 'error');
        return false;
    }
}

// Функция для загрузки состояния тренировки
export async function loadTrainingState(trainingId) {
    try {
        console.log('Загрузка состояния тренировки:', trainingId);
        
        // Пытаемся загрузить сохраненное состояние тренировки
        const trainingState = await trainingStateApi.getTrainingState(trainingId);
        console.log('Загруженное состояние тренировки:', trainingState);

        if (trainingState && trainingState.state_data) {
            // Если есть сохраненное состояние, используем его
            console.log('Используем сохраненное состояние тренировки');

            // Восстанавливаем режим тренировки, очередь игроков и состояние кортов
            const stateData = trainingState.state_data;

            // Сохраняем данные в sessionStorage для использования в других функциях
            if (stateData.playersQueue) {
                sessionStorage.setItem('playersQueue', JSON.stringify(stateData.playersQueue));
            }

            // Остальные данные будут использованы при отрисовке интерфейса
            sessionStorage.setItem('trainingState', JSON.stringify(stateData));
            
            return stateData;
        } else {
            console.log('Сохраненное состояние не найдено, используем начальное состояние');
            // Очищаем сохраненное состояние, если оно было
            sessionStorage.removeItem('trainingState');
            return null;
        }
    } catch (error) {
        console.error('Ошибка при загрузке состояния тренировки:', error);
        showMessage('Не удалось загрузить сохраненное состояние тренировки', 'error');
        // Очищаем сохраненное состояние в случае ошибки
        sessionStorage.removeItem('trainingState');
        return null;
    }
}

// Функция для обработки выбора победителя
export function handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers, saveTrainingState) {
    // Определяем победителей и проигравших
    let winners, losers;

    if (winnerTeam === 'top') {
        winners = topPlayers;
        losers = bottomPlayers;
        showMessage(`Победила команда: ${topPlayers[0].name}/${topPlayers[1].name}`, 'success');
    } else {
        winners = bottomPlayers;
        losers = topPlayers;
        showMessage(`Победила команда: ${bottomPlayers[0].name}/${bottomPlayers[1].name}`, 'success');
    }

    // Получаем элемент корта
    const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
    if (!courtElement) {
        console.error('Не найден элемент корта');
        return;
    }

    // Получаем рейтинги игроков из очереди в sessionStorage
    const getPlayerRating = (playerId) => {
        let rating = 0;
        const queueJson = sessionStorage.getItem('playersQueue');
        if (queueJson) {
            try {
                const queue = JSON.parse(queueJson);
                const player = queue.find(p => p.id === playerId);
                if (player) {
                    rating = parseInt(player.rating) || 0;
                }
            } catch (e) {
                console.error('Ошибка при получении рейтинга игрока:', e);
            }
        }
        return rating;
    };

    // Сначала добавляем игроков в очередь, затем удаляем их с корта
    console.log('Добавляем победителей в очередь:', winners);
    winners.forEach(player => {
        const rating = getPlayerRating(player.id);
        console.log(`Добавляем победителя ${player.name} (ID: ${player.id}) с рейтингом ${rating} в очередь`);
        addPlayerToQueue(player.id, 'end');
    });

    console.log('Добавляем проигравших в очередь:', losers);
    losers.forEach(player => {
        const rating = getPlayerRating(player.id);
        console.log(`Добавляем проигравшего ${player.name} (ID: ${player.id}) с рейтингом ${rating} в очередь`);
        addPlayerToQueue(player.id, 'end');
    });

    // Теперь удаляем игроков с корта
    const courtPlayers = courtElement.querySelectorAll('.court-player');
    courtPlayers.forEach(player => {
        player.classList.add('removing');
        setTimeout(() => {
            player.remove();
        }, 300);
    });

    // Разблокируем изменение состава игроков и сбрасываем цвет корта
    unlockCourtPlayers(courtElement);

    // Обновляем состояние корта после удаления игроков
    setTimeout(() => {
        // Обновляем видимость кнопок на всех половинах корта
        const courtHalves = courtElement.querySelectorAll('.court-half');
        courtHalves.forEach(half => {
            updateCourtHalfButtons(half);
        });
    }, 350);

    // Сбрасываем кнопку "Начать игру"
    const startGameBtn = courtElement.querySelector('.start-game-btn');
    if (startGameBtn) {
        // Очищаем интервал таймера, если он есть
        const timerId = startGameBtn.getAttribute('data-timer-id');
        if (timerId) {
            clearInterval(parseInt(timerId));
        }

        startGameBtn.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
        startGameBtn.classList.remove('timer-active');
        startGameBtn.classList.remove('timer-transition');
        startGameBtn.style.pointerEvents = '';
        startGameBtn.title = '';
        startGameBtn.removeAttribute('data-timer-id');
        startGameBtn.removeAttribute('data-start-time');

        // Инициализируем иконки Feather
        if (window.feather) {
            feather.replace();
        }
    }

    // Сохраняем обновленное состояние тренировки
    if (saveTrainingState) {
        saveTrainingState();
    }
}