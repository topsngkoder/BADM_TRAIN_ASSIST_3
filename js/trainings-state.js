// Модуль для работы с состоянием тренировки
import { trainingStateApi, playersApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, unlockCourtPlayers } from './trainings-court.js';
import { addPlayerToQueue } from './trainings-players.js';

// Получаем доступ к глобальному экземпляру Supabase
const supabase = window.supabaseClient;

// Функция для загрузки данных игроков в локальное хранилище
async function loadPlayersToLocalStorage(stateData) {
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

        // Загружаем данные каждого игрока
        const playerPromises = Array.from(playerIds).map(async playerId => {
            try {
                const player = await playersApi.getPlayer(playerId);
                if (player) {
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

    } catch (error) {
        console.error('Ошибка при загрузке игроков в локальное хранилище:', error);
    }
}

// Функция для сохранения текущего состояния тренировки в локальное хранилище
export async function updateLocalTrainingState() {
    try {

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

        // Используем requestAnimationFrame для оптимизации DOM-операций
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                try {
                    // Получаем текущую очередь игроков из DOM
                    let playersQueue = [];
                    const queuePlayerCards = document.querySelectorAll('.queue-player-card');

                    if (queuePlayerCards.length > 0) {
                        // Собираем ID игроков из карточек в очереди
                        playersQueue = Array.from(queuePlayerCards).map(card => {
                            const playerId = card.getAttribute('data-player-id');
                            return { id: String(playerId) };
                        });

                        // Обновляем очередь в локальном хранилище
                        trainingStateApi._localState.playersQueue = [...playersQueue];
                    } else {
                        // Если в DOM нет карточек игроков, очищаем очередь
                        trainingStateApi._localState.playersQueue = [];
                    }

                    // Обновляем player_ids в таблице trainings, чтобы включить всех игроков
                    try {
                        // Получаем всех игроков на тренировке (в очереди и на кортах)
                        const allPlayerIds = new Set();

                        // Добавляем игроков из очереди
                        playersQueue.forEach(player => {
                            if (player && player.id) {
                                allPlayerIds.add(parseInt(player.id));
                            }
                        });

                        // Добавляем игроков с кортов
                        const courtPlayers = document.querySelectorAll('.court-player');
                        courtPlayers.forEach(player => {
                            const playerId = player.getAttribute('data-player-id');
                            if (playerId) {
                                allPlayerIds.add(parseInt(playerId));
                            }
                        });

                        // Обновляем player_ids в таблице trainings
                        if (allPlayerIds.size > 0) {
                            const playerIdsArray = Array.from(allPlayerIds);

                            // Используем промисы вместо await, так как мы в синхронном контексте
                            supabase
                                .from('trainings')
                                .select('player_ids')
                                .eq('id', parseInt(trainingId))
                                .single()
                                .then(({ data: trainingData, error: trainingError }) => {
                                    if (trainingError) {
                                        console.error('Ошибка при получении данных тренировки:', trainingError);
                                        return;
                                    }

                                    if (trainingData) {
                                        // Объединяем текущие player_ids с новыми
                                        const currentPlayerIds = trainingData.player_ids || [];
                                        const updatedPlayerIds = new Set([...playerIdsArray]);

                                        currentPlayerIds.forEach(id => updatedPlayerIds.add(id));

                                        const finalPlayerIds = Array.from(updatedPlayerIds);

                                        // Обновляем player_ids в базе данных
                                        supabase
                                            .from('trainings')
                                            .update({ player_ids: finalPlayerIds })
                                            .eq('id', parseInt(trainingId))
                                            .then(({ error }) => {
                                                if (error) {
                                                    console.error('Ошибка при обновлении player_ids:', error);
                                                } else {
                                                    console.log('player_ids успешно обновлены:', finalPlayerIds);
                                                }
                                            });
                                    }
                                });
                        }
                    } catch (playerIdsError) {
                        console.error('Ошибка при обновлении player_ids:', playerIdsError);
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
                                // Проверяем наличие значка "2-я игра"
                                const hasSecondGameBadge = !!playerElement.querySelector('.second-game-badge');

                                return {
                                    id: playerElement.getAttribute('data-player-id'),
                                    name: playerElement.querySelector('.court-player-name').textContent,
                                    hasSecondGameBadge: hasSecondGameBadge
                                };
                            });

                        // Получаем игроков на нижней половине корта
                        const bottomHalf = courtElement.querySelector('.court-half[data-half="bottom"]');
                        const bottomPlayers = Array.from(bottomHalf.querySelectorAll('.court-player'))
                            .map(playerElement => {
                                // Проверяем наличие значка "2-я игра"
                                const hasSecondGameBadge = !!playerElement.querySelector('.second-game-badge');

                                return {
                                    id: playerElement.getAttribute('data-player-id'),
                                    name: playerElement.querySelector('.court-player-name').textContent,
                                    hasSecondGameBadge: hasSecondGameBadge
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

                    resolve(true);
                } catch (innerError) {
                    console.error('Ошибка при обновлении локального состояния тренировки:', innerError);
                    resolve(false);
                }
            });
        });
    } catch (error) {
        console.error('Ошибка при обновлении локального состояния тренировки:', error);
        return false;
    }
}

// Функция для сохранения текущего состояния тренировки в базу данных
export async function saveTrainingState() {
    try {
        // Сначала обновляем локальное состояние
        await updateLocalTrainingState();

        // Сохраняем состояние в базу данных без повторного обновления
        return await saveTrainingStateWithoutUpdate();
    } catch (error) {
        console.error('Ошибка при сохранении состояния тренировки в базу данных:', error);
        showMessage('Не удалось сохранить состояние тренировки', 'error');
        return false;
    }
}

// Функция для обновления только локального состояния без сохранения в базу данных
export async function updateLocalTrainingStateOnly() {
    try {
        // Обновляем только локальное состояние
        await updateLocalTrainingState();
        console.log('Локальное состояние обновлено без сохранения в базу данных');
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении локального состояния:', error);
        return false;
    }
}

// Функция для сохранения текущего состояния тренировки в базу данных без обновления локального состояния
export async function saveTrainingStateWithoutUpdate() {
    try {
        console.log('Сохранение текущего состояния тренировки в базу данных без обновления локального состояния');

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

        // Сохраняем состояние в базу данных
        await trainingStateApi.saveTrainingState(trainingId, stateData);
        console.log('Состояние тренировки успешно сохранено в базу данных');

        // Не показываем сообщение пользователю при каждом сохранении

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

        // Инициализируем локальное хранилище игроков
        playersApi.initLocalPlayers();

        // Инициализируем локальное хранилище состояния тренировки
        trainingStateApi.initLocalState(parseInt(trainingId));

        // Пытаемся загрузить состояние тренировки из базы данных
        const trainingState = await trainingStateApi.getTrainingState(trainingId);
        console.log('Загруженное состояние тренировки:', trainingState);

        if (trainingState && trainingState.state_data) {

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

                        // Не сохраняем состояние в базу данных при загрузке
                        console.log('Очередь игроков добавлена в локальное состояние');
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

                    // Создаем начальное состояние
                    const initialState = {
                        trainingId: parseInt(trainingId),
                        courts: [],
                        playersQueue: [],
                        courtCount: training.court_count || 1,
                        trainingMode: 'max-two-wins',
                        lastUpdated: new Date().toISOString()
                    };

                    // Если у тренировки есть игроки, добавляем их в очередь
                    if (training.player_ids && Array.isArray(training.player_ids) && training.player_ids.length > 0) {
                        initialState.playersQueue = training.player_ids.map(id => ({ id: String(id) }));
                    }

                    // Не сохраняем начальное состояние в базу данных при загрузке
                    console.log('Начальное состояние создано в локальном хранилище');

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
                trainingMode: 'max-two-wins',
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
export function handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers, saveTrainingState) {
    console.log('Обработка выбора победителя:', { courtId, winnerTeam, topPlayers, bottomPlayers });

    // Определяем победителей и проигравших
    let winners, losers;

    if (winnerTeam === 'top') {
        winners = topPlayers;
        losers = bottomPlayers;
    } else {
        winners = bottomPlayers;
        losers = topPlayers;
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

    // Получаем текущий режим тренировки
    const trainingModeSelect = document.getElementById('training-mode');
    const currentMode = trainingModeSelect ? trainingModeSelect.value : 'single';


    // Разблокируем изменение состава игроков на корте
    unlockCourtPlayers(courtElement);

    // Сбрасываем кнопку "Начать игру"
    resetGameButton(courtElement);

    // Обрабатываем в зависимости от режима тренировки
    if (currentMode === 'max-two-wins') {
        // Режим "Не больше двух побед"
        handleMaxTwoWinsMode(courtId, courtElement, winners, losers, trainingId, saveTrainingState);
    } else {
        // Стандартный режим "Играем один раз"
        handleSingleGameMode(courtId, courtElement, winners, losers, trainingId, saveTrainingState);
    }
}

// Функция для обработки режима "Играем один раз"
async function handleSingleGameMode(courtId, courtElement, winners, losers, trainingId, saveTrainingState) {

    

    // Получаем всех игроков на корте
    const courtPlayers = courtElement.querySelectorAll('.court-player');
    const allPlayers = [...winners, ...losers];

    // Создаем массив для хранения удаленных игроков
    const removedPlayers = [];

    // Сначала удаляем игроков из локального состояния
    if (courtId) {

        // Для каждого игрока находим его позицию и удаляем из локального состояния
        allPlayers.forEach(player => {
            const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (playerElement) {
                const slot = playerElement.closest('.court-player-slot');
                if (slot) {
                    const half = slot.closest('.court-half').getAttribute('data-half');
                    const slotIndex = Array.from(slot.parentNode.children).indexOf(slot) + 1;
                    const position = `${half}${slotIndex}`;

                    // Удаляем игрока с корта в локальном состоянии
                    try {
                        trainingStateApi.removePlayerFromCourt(courtId, position);

                        // Добавляем игрока в список удаленных
                        removedPlayers.push(player);

                        // Удаляем игрока из DOM
                        try {
                            playerElement.remove();
                            console.log(`Игрок ${player.name} (ID: ${player.id}) удален из DOM`);
                        } catch (domError) {
                            console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) из DOM:`, domError);
                        }
                    } catch (error) {
                        console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) с корта:`, error);
                    }
                }
            } else {
                console.warn(`Не найден элемент игрока с ID ${player.id} на корте`);
            }
        });
    }

    // Проверяем, остались ли игроки на корте
    const remainingPlayers = courtElement.querySelectorAll('.court-player');

    // Если остались игроки, удаляем их принудительно
    if (remainingPlayers.length > 0) {
        console.warn('Остались игроки на корте после удаления, удаляем принудительно');
        remainingPlayers.forEach(player => {
            try {
                player.remove();
                console.log('Игрок принудительно удален из DOM');
            } catch (error) {
                console.error('Ошибка при принудительном удалении игрока из DOM:', error);
            }
        });
    }

    // Обновляем локальное состояние тренировки после удаления игроков с корта
    await updateLocalTrainingState();

    // Функция для добавления игроков в очередь без дублирования
    const addPlayersToQueue = async () => {
        // Получаем контейнер очереди
        const queueContainer = document.querySelector('.players-queue-container');
        if (!queueContainer) {
            console.error('Не найден контейнер очереди');
            return;
        }

        // Проверяем, есть ли сообщение "Нет игроков в очереди"
        const noPlayersMessage = queueContainer.querySelector('.no-players-message');
        if (noPlayersMessage) {
            noPlayersMessage.remove();
        }

        // Сначала добавляем победителей
        for (const player of winners) {

            // Проверяем, есть ли уже этот игрок в очереди
            const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${player.id}"]`);
            if (existingQueuePlayer) {
                console.log(`Игрок с ID ${player.id} уже есть в очереди`);
                continue;
            }

            // Проверяем, есть ли уже этот игрок на корте
            const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (existingCourtPlayer) {
                console.log(`Игрок с ID ${player.id} уже есть на корте`);
                continue;
            }

            // Сначала обновляем локальное состояние
            trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');

            // Затем добавляем игрока в DOM и обрабатываем UI
            try {
                const result = await addPlayerToQueue(player.id, 'end', trainingId);
                console.log(`Результат добавления победителя ${player.name} в очередь:`, result ? "успешно" : "не добавлен");
            } catch (error) {
                console.error(`Ошибка при добавлении победителя ${player.name} в очередь:`, error);
            }
        }

        // Затем добавляем проигравших
        for (const player of losers) {

            // Проверяем, есть ли уже этот игрок в очереди
            const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${player.id}"]`);
            if (existingQueuePlayer) {
                console.log(`Игрок с ID ${player.id} уже есть в очереди`);
                continue;
            }

            // Проверяем, есть ли уже этот игрок на корте
            const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (existingCourtPlayer) {
                console.log(`Игрок с ID ${player.id} уже есть на корте`);
                continue;
            }

            // Сначала обновляем локальное состояние
            trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');

            // Затем добавляем игрока в DOM и обрабатываем UI
            try {
                const result = await addPlayerToQueue(player.id, 'end', trainingId);
                console.log(`Результат добавления проигравшего ${player.name} в очередь:`, result ? "успешно" : "не добавлен");
            } catch (error) {
                console.error(`Ошибка при добавлении проигравшего ${player.name} в очередь:`, error);
            }
        }

        // Обновляем локальное состояние тренировки
        await updateLocalTrainingState();

        // Обновляем только локальное состояние без сохранения в базу данных
        try {
            if (typeof window.updateLocalTrainingState === 'function') {
                await window.updateLocalTrainingState();
                console.log('Локальное состояние обновлено после добавления игроков в очередь');
            }
        } catch (error) {
            console.error('Ошибка при обновлении локального состояния:', error);
        }
    };

    // Добавляем игроков в очередь
    await addPlayersToQueue();

    // Обновляем состояние корта после удаления игроков
    setTimeout(() => {
        // Обновляем видимость кнопок на всех половинах корта
        const courtHalves = courtElement.querySelectorAll('.court-half');
        courtHalves.forEach(half => {
            updateCourtHalfButtons(half);
        });
    }, 350);

    // Сбрасываем кнопку "Начать игру"
    resetGameButton(courtElement);

    // Обновляем локальное состояние тренировки после всех изменений
    updateLocalTrainingState().catch(error => {
        console.error('Ошибка при обновлении локального состояния:', error);
    });

}

// Функция для обработки режима "Не больше двух побед"
async function handleMaxTwoWinsMode(courtId, courtElement, winners, losers, trainingId, saveTrainingState) {

    // Проверяем, есть ли у победителей уже одна победа (значок "2-я игра")
    const winnersHaveBadge = winners.some(player => {
        const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
        return playerElement && playerElement.querySelector('.second-game-badge');
    });


    if (winnersHaveBadge) {

        // Удаляем всех игроков с корта
        const courtPlayers = courtElement.querySelectorAll('.court-player');
        const allPlayers = [...winners, ...losers];

        // Создаем массив для хранения удаленных игроков
        const removedPlayers = [];

        // Сначала удаляем игроков из локального состояния
        if (courtId) {

            // Для каждого игрока находим его позицию и удаляем из локального состояния
            allPlayers.forEach(player => {
                const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
                if (playerElement) {
                    const slot = playerElement.closest('.court-player-slot');
                    if (slot) {
                        const half = slot.closest('.court-half').getAttribute('data-half');
                        const slotIndex = Array.from(slot.parentNode.children).indexOf(slot) + 1;
                        const position = `${half}${slotIndex}`;

                        // Удаляем игрока с корта в локальном состоянии
                        try {
                            trainingStateApi.removePlayerFromCourt(courtId, position);

                            // Добавляем игрока в список удаленных
                            removedPlayers.push(player);

                            // Удаляем игрока из DOM
                            try {
                                playerElement.remove();
                            } catch (domError) {
                                console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) из DOM:`, domError);
                            }
                        } catch (error) {
                            console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) с корта:`, error);
                        }
                    }
                } else {
                    console.warn(`Не найден элемент игрока с ID ${player.id} на корте`);
                }
            });
        }

        // Проверяем, остались ли игроки на корте
        const remainingPlayers = courtElement.querySelectorAll('.court-player');

        // Если остались игроки, удаляем их принудительно
        if (remainingPlayers.length > 0) {
            console.warn('Остались игроки на корте после удаления, удаляем принудительно');
            remainingPlayers.forEach(player => {
                try {
                    player.remove();
                    console.log('Игрок принудительно удален из DOM');
                } catch (error) {
                    console.error('Ошибка при принудительном удалении игрока из DOM:', error);
                }
            });
        }

        // Обновляем локальное состояние тренировки после удаления игроков с корта
        await updateLocalTrainingState();

        // Функция для добавления игроков в очередь
        const addPlayersToQueue = async () => {
            // Получаем контейнер очереди
            const queueContainer = document.querySelector('.players-queue-container');
            if (!queueContainer) {
                console.error('Не найден контейнер очереди');
                return;
            }

            // Проверяем, есть ли сообщение "Нет игроков в очереди"
            const noPlayersMessage = queueContainer.querySelector('.no-players-message');
            if (noPlayersMessage) {
                noPlayersMessage.remove();
            }

            // Сначала добавляем победителей в конец очереди
            for (const player of winners) {

                // Проверяем, есть ли уже этот игрок в очереди
                const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${player.id}"]`);
                if (existingQueuePlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть в очереди`);
                    continue;
                }

                // Проверяем, есть ли уже этот игрок на корте
                const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${player.id}"]`);
                if (existingCourtPlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть на корте`);
                    continue;
                }

                // Сначала обновляем локальное состояние
                trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');

                // Затем добавляем игрока в DOM и обрабатываем UI
                try {
                    const result = await addPlayerToQueue(player.id, 'end', trainingId);
                    console.log(`Результат добавления победителя ${player.name} в очередь:`, result ? "успешно" : "не добавлен");
                } catch (error) {
                    console.error(`Ошибка при добавлении победителя ${player.name} в очередь:`, error);
                }
            }

            // Затем добавляем проигравших в конец очереди
            for (const player of losers) {

                // Проверяем, есть ли уже этот игрок в очереди
                const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${player.id}"]`);
                if (existingQueuePlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть в очереди`);
                    continue;
                }

                // Проверяем, есть ли уже этот игрок на корте
                const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${player.id}"]`);
                if (existingCourtPlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть на корте`);
                    continue;
                }

                // Сначала обновляем локальное состояние
                trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');

                // Затем добавляем игрока в DOM и обрабатываем UI
                try {
                    const result = await addPlayerToQueue(player.id, 'end', trainingId);
                    console.log(`Результат добавления проигравшего ${player.name} в очередь:`, result ? "успешно" : "не добавлен");
                } catch (error) {
                    console.error(`Ошибка при добавлении проигравшего ${player.name} в очередь:`, error);
                }
            }

            // Обновляем локальное состояние тренировки
            await updateLocalTrainingState();

            // Сохраняем состояние в базу данных
            if (saveTrainingState && typeof saveTrainingState === 'function') {
                await saveTrainingState();
            }
        };

        // Добавляем игроков в очередь
        await addPlayersToQueue();

        // Обновляем состояние корта после удаления игроков
        setTimeout(() => {
            // Обновляем видимость кнопок на всех половинах корта
            const courtHalves = courtElement.querySelectorAll('.court-half');
            courtHalves.forEach(half => {
                updateCourtHalfButtons(half);
            });
        }, 350);

        // Сбрасываем кнопку "Начать игру"
        resetGameButton(courtElement);
    } else {
        

        // Создаем массив для хранения удаленных игроков
        const removedPlayers = [];

        losers.forEach(player => {
            const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (playerElement) {

                // Сначала удаляем игрока из локального состояния
                if (courtId) {
                    const slot = playerElement.closest('.court-player-slot');
                    if (slot) {
                        const half = slot.closest('.court-half').getAttribute('data-half');
                        const slotIndex = Array.from(slot.parentNode.children).indexOf(slot) + 1;
                        const position = `${half}${slotIndex}`;

                        // Удаляем игрока с корта в локальном состоянии
                        try {
                            trainingStateApi.removePlayerFromCourt(courtId, position);

                            // Добавляем игрока в список удаленных
                            removedPlayers.push(player);
                        } catch (error) {
                            console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) с корта:`, error);
                        }
                    }
                }

                // Затем удаляем игрока из DOM
                try {
                    playerElement.remove();
                } catch (error) {
                    console.error(`Ошибка при удалении игрока ${player.name} (ID: ${player.id}) из DOM:`, error);
                }
            } else {
                console.warn(`Не найден элемент игрока ${player.name} (ID: ${player.id}) на корте`);
            }
        });

        
        // Проверяем, остались ли проигравшие на корте
        losers.forEach(player => {
            const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (playerElement) {
                console.warn(`Игрок ${player.name} (ID: ${player.id}) все еще на корте, удаляем принудительно`);
                try {
                    playerElement.remove();
                } catch (error) {
                    console.error(`Ошибка при принудительном удалении игрока ${player.name} (ID: ${player.id}):`, error);
                }
            }
        });

        // Обновляем локальное состояние тренировки после удаления проигравших с корта
        await updateLocalTrainingState();

        // Добавляем значок "2-я игра" победителям
        winners.forEach(player => {
            const playerElement = courtElement.querySelector(`.court-player[data-player-id="${player.id}"]`);
            if (playerElement) {
                const photoContainer = playerElement.querySelector('.court-player-photo-container');
                if (photoContainer && !photoContainer.querySelector('.second-game-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'second-game-badge';
                    badge.textContent = '2';
                    photoContainer.appendChild(badge);
                }
            }
        });

        // Функция для добавления проигравших в очередь
        const addLosersToQueue = async () => {
            // Получаем контейнер очереди
            const queueContainer = document.querySelector('.players-queue-container');
            if (!queueContainer) {
                console.error('Не найден контейнер очереди');
                return;
            }

            // Проверяем, есть ли сообщение "Нет игроков в очереди"
            const noPlayersMessage = queueContainer.querySelector('.no-players-message');
            if (noPlayersMessage) {
                noPlayersMessage.remove();
            }

            // Добавляем проигравших в конец очереди
            for (const player of losers) {

                // Проверяем, есть ли уже этот игрок в очереди
                const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${player.id}"]`);
                if (existingQueuePlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть в очереди`);
                    continue;
                }

                // Проверяем, есть ли уже этот игрок на корте
                const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${player.id}"]`);
                if (existingCourtPlayer) {
                    console.log(`Игрок с ID ${player.id} уже есть на корте`);
                    continue;
                }

                // Сначала обновляем локальное состояние
                trainingStateApi.addPlayerToQueue(trainingId, player.id, 'end');

                // Затем добавляем игрока в DOM и обрабатываем UI
                try {
                    const result = await addPlayerToQueue(player.id, 'end', trainingId);
                    console.log(`Результат добавления проигравшего ${player.name} в очередь:`, result ? "успешно" : "не добавлен");
                } catch (error) {
                    console.error(`Ошибка при добавлении проигравшего ${player.name} в очередь:`, error);
                }
            }

            // Обновляем локальное состояние тренировки
            await updateLocalTrainingState();

            // Сохраняем состояние в базу данных
            if (saveTrainingState && typeof saveTrainingState === 'function') {
                await saveTrainingState();
            }
        };

        // Добавляем проигравших в очередь
        await addLosersToQueue();

        // Сбрасываем кнопку "Начать игру"
        resetGameButton(courtElement);

        // Разблокируем возможность удалять оставшихся игроков с корта
        unlockCourtPlayers(courtElement);

        // Обновляем состояние корта после удаления игроков
        setTimeout(() => {
            // Обновляем видимость кнопок на всех половинах корта
            const courtHalves = courtElement.querySelectorAll('.court-half');
            courtHalves.forEach(half => {
                updateCourtHalfButtons(half);
            });
        }, 350);
    }

    // Обновляем локальное состояние тренировки после всех изменений
    updateLocalTrainingState().catch(error => {
        console.error('Ошибка при обновлении локального состояния:', error);
    });
}

// Функция для сброса кнопки "Начать игру"
function resetGameButton(courtElement) {
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

        // Обновляем видимость кнопки в зависимости от статуса игры и количества игроков
        // Получаем все слоты для игроков на этом корте
        const slots = courtElement.querySelectorAll('.court-player-slot');

        // Считаем количество занятых слотов
        let occupiedSlots = 0;
        slots.forEach(slot => {
            if (slot.children.length > 0) {
                occupiedSlots++;
            }
        });

        // Проверяем, не идет ли уже игра на этом корте
        const isGameInProgress = courtElement.classList.contains('game-in-progress');

        // Если все 4 слота заняты и игра не в процессе, показываем кнопку "Начать игру"
        if (occupiedSlots === 4 && !isGameInProgress) {
            startGameBtn.style.display = '';
        } else {
            startGameBtn.style.display = 'none';
        }
    }
}