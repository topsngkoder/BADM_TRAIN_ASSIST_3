// Модуль для работы с состоянием тренировки
import { trainingStateApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, unlockCourtPlayers } from './trainings-court.js';
import { addPlayerToQueue } from './trainings-players.js';

// Функция для сохранения текущего состояния тренировки
export async function saveTrainingState() {
    try {
        console.log('Сохранение текущего состояния тренировки');

        // Получаем ID текущей тренировки из URL
        const urlParams = new URLSearchParams(window.location.search);
        const trainingId = urlParams.get('id');

        if (!trainingId) {
            console.error('Не найден ID текущей тренировки в URL');
            return;
        }

        // Получаем текущую очередь игроков из DOM
        let playersQueue = [];
        const queuePlayerCards = document.querySelectorAll('.queue-player-card');

        if (queuePlayerCards.length > 0) {
            // Собираем ID игроков из карточек в очереди
            playersQueue = Array.from(queuePlayerCards).map(card => {
                const playerId = card.getAttribute('data-player-id');
                return { id: String(playerId) };
            });

            console.log('Очередь игроков из DOM:', playersQueue);
        } else {
            // Если в DOM нет карточек игроков, получаем очередь из базы данных
            try {
                playersQueue = await trainingStateApi.getPlayersQueue(trainingId);
                console.log('Очередь игроков из базы данных:', playersQueue);
            } catch (e) {
                console.error('Ошибка при получении очереди игроков из базы данных:', e);
                playersQueue = [];
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

            // Получаем название корта из заголовка
            const courtHeader = courtElement.querySelector('.court-header h4');
            const courtName = courtHeader ? courtHeader.textContent.trim() : `Корт ${courtId}`;

            // Добавляем данные о корте
            courts.push({
                id: courtId,
                name: courtName,
                gameInProgress: isGameInProgress,
                topPlayers: isGameInProgress ? topPlayers : [],
                bottomPlayers: isGameInProgress ? bottomPlayers : [],
                gameStartTime
            });
        });

        // Получаем общее количество кортов
        const courtCount = courtElements.length;

        // Формируем объект с данными состояния
        const stateData = {
            trainingId,
            trainingMode,
            playersQueue,
            courts,
            courtCount,
            lastUpdated: new Date().toISOString()
        };

        // Сохраняем состояние в базе данных
        await trainingStateApi.saveTrainingState(trainingId, stateData);
        console.log('Состояние тренировки успешно сохранено');

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

            // Добавляем ID тренировки в URL, если его там нет
            if (!window.location.search.includes('id=')) {
                const url = new URL(window.location);
                url.searchParams.set('id', trainingId);
                window.history.pushState({}, '', url);
            }

            // Если в состоянии нет очереди игроков, получаем ее отдельно
            if (!stateData.playersQueue || !Array.isArray(stateData.playersQueue) || stateData.playersQueue.length === 0) {
                try {
                    console.log('В состоянии нет очереди игроков, получаем ее отдельно');
                    const playersQueue = await trainingStateApi.getPlayersQueue(trainingId);
                    if (playersQueue && playersQueue.length > 0) {
                        console.log('Получена очередь игроков:', playersQueue);
                        stateData.playersQueue = playersQueue;
                    }
                } catch (queueError) {
                    console.error('Ошибка при получении очереди игроков:', queueError);
                }
            }

            return stateData;
        } else {
            console.log('Сохраненное состояние не найдено, используем начальное состояние');

            // Пытаемся получить очередь игроков отдельно
            try {
                console.log('Получаем очередь игроков отдельно');
                const playersQueue = await trainingStateApi.getPlayersQueue(trainingId);
                if (playersQueue && playersQueue.length > 0) {
                    console.log('Получена очередь игроков:', playersQueue);
                    return { playersQueue };
                }
            } catch (queueError) {
                console.error('Ошибка при получении очереди игроков:', queueError);
            }

            return null;
        }
    } catch (error) {
        console.error('Ошибка при загрузке состояния тренировки:', error);

        // Показываем сообщение об ошибке пользователю
        showMessage('Ошибка при загрузке тренировки из базы данных', 'error');

        // Выбрасываем ошибку дальше, чтобы она была обработана в вызывающем коде
        throw error;
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

    // Получаем ID тренировки из URL
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('id');

    if (!trainingId) {
        console.error('Не найден ID тренировки в URL');
        return;
    }

    // Сначала добавляем игроков в очередь, затем удаляем их с корта
    console.log('Добавляем победителей и проигравших в очередь');

    // Функция для добавления игроков в очередь без дублирования
    const addPlayersToQueue = async () => {
        // Сначала добавляем победителей
        console.log('Добавляем победителей в очередь:', winners);
        for (const player of winners) {
            console.log(`Добавляем победителя ${player.name} (ID: ${player.id}) в очередь`);
            await trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');
            await addPlayerToQueue(player.id, 'end');
        }

        // Затем добавляем проигравших
        console.log('Добавляем проигравших в очередь:', losers);
        for (const player of losers) {
            console.log(`Добавляем проигравшего ${player.name} (ID: ${player.id}) в очередь`);
            await trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');
            await addPlayerToQueue(player.id, 'end');
        }

        // После добавления всех игроков сохраняем состояние
        if (saveTrainingState) {
            console.log('Сохраняем состояние тренировки после добавления всех игроков в очередь');
            await saveTrainingState();
        }
    };

    // Добавляем игроков в очередь
    addPlayersToQueue();

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

    // Сохраняем обновленное состояние тренировки еще раз после всех изменений
    setTimeout(() => {
        if (saveTrainingState) {
            console.log('Сохраняем финальное состояние тренировки после всех изменений');
            saveTrainingState();
        }
    }, 500); // Даем время на завершение всех анимаций и обновлений DOM
}