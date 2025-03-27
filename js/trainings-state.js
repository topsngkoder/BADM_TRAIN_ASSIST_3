// Модуль для работы с состоянием тренировки
import { trainingStateApi, playersApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, unlockCourtPlayers } from './trainings-court.js';
import { addPlayerToQueue } from './trainings-players.js';

// Функция для загрузки данных игроков в локальное хранилище
async function loadPlayersToLocalStorage(stateData) {
    console.log('Загрузка данных игроков в локальное хранилище');

    try {
        // Получаем уникальные ID игроков из очереди и кортов
        const playerIds = new Set();

        // Добавляем ID игроков из очереди
        if (stateData.playersQueue && Array.isArray(stateData.playersQueue)) {
            stateData.playersQueue.forEach(player => {
                if (player && player.id) {
                    playerIds.add(player.id);
                }
            });
        }

        // Добавляем ID игроков с кортов
        if (stateData.courts && Array.isArray(stateData.courts)) {
            stateData.courts.forEach(court => {
                // Игроки на верхней половине корта
                if (court.topPlayers && Array.isArray(court.topPlayers)) {
                    court.topPlayers.forEach(player => {
                        if (player && player.id) {
                            playerIds.add(player.id);
                        }
                    });
                }

                // Игроки на нижней половине корта
                if (court.bottomPlayers && Array.isArray(court.bottomPlayers)) {
                    court.bottomPlayers.forEach(player => {
                        if (player && player.id) {
                            playerIds.add(player.id);
                        }
                    });
                }
            });
        }

        console.log('Найдено уникальных ID игроков:', playerIds.size);

        // Загружаем данные каждого игрока
        const playerPromises = Array.from(playerIds).map(async playerId => {
            try {
                const player = await playersApi.getPlayer(playerId);
                if (player) {
                    console.log(`Игрок с ID ${playerId} загружен в локальное хранилище`);
                } else {
                    console.warn(`Не удалось загрузить игрока с ID ${playerId}`);
                }
                return player;
            } catch (error) {
                console.error(`Ошибка при загрузке игрока с ID ${playerId}:`, error);
                return null;
            }
        });

        // Ждем загрузки всех игроков
        await Promise.all(playerPromises);

        console.log('Все игроки загружены в локальное хранилище');
    } catch (error) {
        console.error('Ошибка при загрузке игроков в локальное хранилище:', error);
    }
}

// Функция для сохранения текущего состояния тренировки в локальное хранилище
export async function updateLocalTrainingState() {
    try {
        console.log('Обновление локального состояния тренировки');

        // Получаем ID текущей тренировки из URL
        const urlParams = new URLSearchParams(window.location.search);
        const trainingId = urlParams.get('id');

        if (!trainingId) {
            console.error('Не найден ID текущей тренировки в URL');
            return false;
        }

        // Проверяем, инициализировано ли локальное хранилище
        if (trainingStateApi._localState.trainingId !== parseInt(trainingId)) {
            trainingStateApi.initLocalState(parseInt(trainingId));
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

            // Обновляем очередь в локальном хранилище
            trainingStateApi._localState.playersQueue = [...playersQueue];
            console.log('Обновлена очередь игроков в локальном хранилище:', trainingStateApi._localState.playersQueue);
        } else {
            // Если в DOM нет карточек игроков, используем очередь из локального хранилища
            playersQueue = [...trainingStateApi._localState.playersQueue] || [];
            console.log('Очередь игроков из локального хранилища:', playersQueue);
        }

        // Получаем текущий режим тренировки
        const trainingModeSelect = document.getElementById('training-mode');
        const trainingMode = trainingModeSelect ? trainingModeSelect.value : 'single';

        // Обновляем режим тренировки в локальном хранилище
        trainingStateApi._localState.trainingMode = trainingMode;

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
                topPlayers: topPlayers,
                bottomPlayers: bottomPlayers,
                gameStartTime
            });
        });

        // Получаем общее количество кортов
        const courtCount = courtElements.length;

        // Обновляем данные в локальном хранилище
        trainingStateApi._localState.courts = [...courts];
        trainingStateApi._localState.courtCount = courtCount;
        trainingStateApi._localState.lastUpdated = new Date().toISOString();

        // Пытаемся сохранить состояние в базу данных
        try {
            await trainingStateApi.saveTrainingState(trainingId, trainingStateApi._localState);
        } catch (saveError) {
            console.error('Ошибка при сохранении состояния в базу данных:', saveError);
            // Продолжаем работу с локальным состоянием
        }

        console.log('Локальное состояние тренировки успешно обновлено');
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении локального состояния тренировки:', error);
        return false;
    }
}

// Функция для сохранения текущего состояния тренировки в базу данных
export async function saveTrainingState() {
    try {
        console.log('Сохранение текущего состояния тренировки в базу данных');

        // Сначала обновляем локальное состояние
        await updateLocalTrainingState();

        // Получаем ID текущей тренировки из URL
        const urlParams = new URLSearchParams(window.location.search);
        const trainingId = urlParams.get('id');

        if (!trainingId) {
            console.error('Не найден ID текущей тренировки в URL');
            return false;
        }

        // Проверяем, инициализировано ли локальное хранилище
        if (trainingStateApi._localState.trainingId !== parseInt(trainingId)) {
            trainingStateApi.initLocalState(parseInt(trainingId));
        }

        // Получаем данные из локального хранилища
        const stateData = { ...trainingStateApi._localState };
        stateData.lastUpdated = new Date().toISOString();

        console.log('Сохраняем состояние тренировки в базу данных:', stateData);
        console.log('Очередь игроков в сохраняемом состоянии:', stateData.playersQueue);

        // Сохраняем состояние в базе данных
        await trainingStateApi.saveTrainingState(trainingId, stateData);
        console.log('Состояние тренировки успешно сохранено');

        // Показываем сообщение пользователю
        showMessage('Состояние тренировки сохранено', 'success');

        return true;
    } catch (error) {
        console.error('Ошибка при сохранении состояния тренировки в базу данных:', error);
        showMessage('Не удалось сохранить состояние тренировки', 'error');
        return false;
    }
}

// Функция для загрузки состояния тренировки
export async function loadTrainingState(trainingId) {
    try {
        console.log('Загрузка состояния тренировки:', trainingId);

        // Инициализируем локальное хранилище игроков
        playersApi.initLocalPlayers();

        // Инициализируем локальное хранилище состояния тренировки
        trainingStateApi.initLocalState(parseInt(trainingId));

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

            // Загружаем данные игроков в локальное хранилище
            await loadPlayersToLocalStorage(stateData);

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

            // Обновляем локальное хранилище состояния тренировки
            trainingStateApi._localState = { ...stateData };

            // Выводим информацию о загруженном состоянии
            console.log('Загружено состояние тренировки:', stateData);
            console.log('Очередь игроков в загруженном состоянии:', stateData.playersQueue);

            return stateData;
        } else {
            console.log('Сохраненное состояние не найдено, создаем начальное состояние');

            // Получаем данные тренировки
            try {
                const training = await trainingsApi.getTrainingById(trainingId);
                if (training) {
                    console.log('Получены данные тренировки:', training);

                    // Создаем начальное состояние
                    const initialState = {
                        trainingId: parseInt(trainingId),
                        courts: [],
                        playersQueue: [],
                        courtCount: training.court_count || 1,
                        trainingMode: 'single',
                        lastUpdated: new Date().toISOString()
                    };

                    // Если у тренировки есть игроки, добавляем их в очередь
                    if (training.player_ids && Array.isArray(training.player_ids) && training.player_ids.length > 0) {
                        initialState.playersQueue = training.player_ids.map(id => ({ id: String(id) }));
                        console.log('Добавлены игроки в очередь:', initialState.playersQueue);
                    }

                    // Сохраняем начальное состояние в базу данных
                    try {
                        await trainingStateApi.saveTrainingState(trainingId, initialState);
                        console.log('Начальное состояние сохранено в базу данных');
                    } catch (saveError) {
                        console.error('Ошибка при сохранении начального состояния:', saveError);
                    }

                    // Обновляем локальное хранилище
                    trainingStateApi._localState = { ...initialState };

                    return initialState;
                }
            } catch (trainingError) {
                console.error('Ошибка при получении данных тренировки:', trainingError);
            }

            // Если не удалось получить данные тренировки, создаем пустое состояние
            const emptyState = {
                trainingId: parseInt(trainingId),
                courts: [],
                playersQueue: [],
                courtCount: 1,
                trainingMode: 'single',
                lastUpdated: new Date().toISOString()
            };

            // Обновляем локальное хранилище
            trainingStateApi._localState = { ...emptyState };

            return emptyState;
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
export function handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers) {
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
            trainingStateApi.addPlayerToQueue(player.id, 'end');
            await addPlayerToQueue(player.id, 'end');
        }

        // Затем добавляем проигравших
        console.log('Добавляем проигравших в очередь:', losers);
        for (const player of losers) {
            console.log(`Добавляем проигравшего ${player.name} (ID: ${player.id}) в очередь`);
            trainingStateApi.addPlayerToQueue(player.id, 'end');
            await addPlayerToQueue(player.id, 'end');
        }

        // Обновляем локальное состояние тренировки
        await updateLocalTrainingState();
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

    

    // Обновляем локальное состояние тренировки после всех изменений
    updateLocalTrainingState().catch(error => {
        console.error('Ошибка при обновлении локального состояния:', error);
    });

    // Показываем сообщение о необходимости сохранить изменения
    showMessage('Изменения внесены в локальное хранилище. Нажмите "Сохранить", чтобы сохранить их в базе данных.', 'info');
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