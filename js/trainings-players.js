// Модуль для работы с игроками и очередью
import { playersApi, trainingStateApi } from './api.js';
import { showMessage, openModal, closeModal } from './ui.js';
import { updateCourtHalfButtons, updateStartGameButton, updateCourtVisibility, startGameTimer, unlockCourtPlayers } from './trainings-court.js';
import { saveTrainingState, saveTrainingStateWithoutUpdate } from './trainings-state.js';

// Получаем доступ к глобальному экземпляру Supabase
const supabase = window.supabaseClient;

// Функция для определения класса рейтинга по значению рейтинга
function getRatingClass(rating) {
    // Преобразуем рейтинг в число, если он передан как строка
    const numericRating = typeof rating === 'string' ? parseInt(rating) : rating;

    // Если рейтинг не определен или не является числом, возвращаем базовый класс
    if (isNaN(numericRating)) {
        return 'rating-blue';
    }

    // Определяем класс в зависимости от значения рейтинга
    if (numericRating >= 800) {
        return 'rating-red';
    } else if (numericRating >= 600) {
        return 'rating-orange';
    } else if (numericRating >= 450) {
        return 'rating-yellow';
    } else if (numericRating >= 300) {
        return 'rating-green';
    } else {
        return 'rating-blue';
    }
}

// Добавляем функцию withoutUpdate к объекту saveTrainingState
saveTrainingState.withoutUpdate = saveTrainingStateWithoutUpdate;

// Функция для добавления игрока из очереди на корт
export async function addPlayerFromQueueToCourt(playerCard, courtId, half, callback) {
    // Получаем ID игрока
    const playerId = playerCard.getAttribute('data-player-id');
    console.log(`Добавление игрока с ID ${playerId} на корт ${courtId}, половина ${half}`);

    // Получаем ID тренировки из URL
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('id');

    if (!trainingId) {
        console.error('Не найден ID тренировки в URL');
        if (callback) callback();
        return;
    }

    // Находим половину корта
    const courtHalf = document.querySelector(`.court-half[data-court="${courtId}"][data-half="${half}"]`);
    if (!courtHalf) {
        console.error(`Не найдена половина корта: корт ${courtId}, половина ${half}`);
        if (callback) callback();
        return;
    }

    // Проверяем, есть ли свободные слоты
    const slots = courtHalf.querySelectorAll('.court-player-slot');
    let emptySlot = null;

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        if (slot.children.length === 0) {
            emptySlot = slot;
            break;
        }
    }

    if (!emptySlot) {
        console.log('Нет свободных слотов на этой половине корта');
        if (callback) callback();
        return;
    }

    try {
        // Получаем данные игрока из карточки в очереди, чтобы избежать запроса к API
        const playerNameElement = playerCard.querySelector('.queue-player-name');
        const playerRatingElement = playerCard.querySelector('.queue-player-rating');
        const playerPhotoElement = playerCard.querySelector('.queue-player-photo');

        let playerFullName = '';
        let playerLastName = '';
        let playerPhoto = '';
        let playerRatingClass = 'rating-blue';
        let rating = 0;

        // Если данные есть в карточке, используем их
        if (playerNameElement) {
            playerFullName = playerNameElement.textContent.trim();
            const nameParts = playerFullName.split(' ');
            playerLastName = nameParts[0] || '';
        }

        if (playerPhotoElement) {
            playerPhoto = playerPhotoElement.src;
        } else {
            playerPhoto = `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;
        }

        if (playerRatingElement) {
            const ratingText = playerRatingElement.textContent.trim();
            const ratingMatch = ratingText.match(/\d+/);
            if (ratingMatch) {
                rating = parseInt(ratingMatch[0]);
            }
        }

        // Определяем класс рейтинга
        if (rating >= 800) {
            playerRatingClass = 'rating-red';
        } else if (rating >= 600) {
            playerRatingClass = 'rating-orange';
        } else if (rating >= 450) {
            playerRatingClass = 'rating-yellow';
        } else if (rating >= 300) {
            playerRatingClass = 'rating-green';
        }

        // Если не удалось получить данные из карточки, запрашиваем из API
        if (!playerFullName) {
            const player = await playersApi.getPlayer(playerId);
            if (!player) {
                console.error(`Игрок с ID ${playerId} не найден`);
                if (callback) callback();
                return;
            }

            playerFullName = `${player.last_name} ${player.first_name}`;
            playerLastName = player.last_name;
            playerPhoto = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;
            rating = player.rating;

            // Определяем класс рейтинга
            playerRatingClass = 'rating-blue';
            if (rating >= 800) {
                playerRatingClass = 'rating-red';
            } else if (rating >= 600) {
                playerRatingClass = 'rating-orange';
            } else if (rating >= 450) {
                playerRatingClass = 'rating-yellow';
            } else if (rating >= 300) {
                playerRatingClass = 'rating-green';
            }
        }

        // Создаем элемент игрока на корте
        const playerElement = document.createElement('div');
        playerElement.className = 'court-player';
        playerElement.setAttribute('data-player-id', playerId);
        playerElement.innerHTML = `
            <div class="court-player-photo-container">
                <img src="${playerPhoto}" alt="${playerFullName}" class="court-player-photo ${playerRatingClass}">
            </div>
            <div class="court-player-name">${playerLastName}</div>
            <button class="remove-player-btn" aria-label="Удалить игрока">
                <i data-feather="x"></i>
            </button>
        `;

        // Удаляем игрока из очереди в DOM сразу для мгновенной реакции
        playerCard.remove();

        // Добавляем игрока в слот
        emptySlot.appendChild(playerElement);

        // Инициализируем иконки Feather только для нового элемента
        if (window.feather) {
            feather.replace(playerElement.querySelector('[data-feather]'));
        }

        // Добавляем обработчик для кнопки удаления игрока с корта
        const removeBtn = playerElement.querySelector('.remove-player-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removePlayerFromCourt(playerElement, playerId);
            });
        }

        // Проверяем, заполнены ли все слоты на этой половине корта
        updateCourtHalfButtons(courtHalf);

        // Проверяем, заполнены ли все слоты на корте
        const courtContainer = courtHalf.closest('.court-container');
        if (courtContainer) {
            updateCourtVisibility(courtContainer);

            // Проверяем, все ли слоты заняты, и если да, то инициализируем кнопку "Начать игру"
            const allSlots = courtContainer.querySelectorAll('.court-player-slot');
            let occupiedSlots = 0;
            allSlots.forEach(slot => {
                if (slot.children.length > 0) {
                    occupiedSlots++;
                }
            });

            if (occupiedSlots === 4) {
                console.log('Все 4 слота заняты, инициализируем кнопку "Начать игру"');
                updateStartGameButton(courtContainer, (buttonElement, courtId) => {
                    console.log('Вызван обработчик нажатия кнопки "Начать игру" для корта', courtId);
                    startGameTimer(buttonElement, courtId,
                        // Обработчик отмены игры
                        async (buttonElement, timerInterval) => {
                            console.log('Вызван обработчик отмены игры');

                            // Обновляем локальное состояние перед сохранением
                            if (typeof window.updateLocalTrainingState === 'function') {
                                try {
                                    await window.updateLocalTrainingState();
                                    console.log('Локальное состояние тренировки успешно обновлено после отмены игры');
                                } catch (error) {
                                    console.error('Ошибка при обновлении локального состояния после отмены игры:', error);
                                }
                            }

                            // Сохраняем состояние в базу данных
                            await saveTrainingState();
                        },
                        // Обработчик завершения игры
                        async (buttonElement, courtId, formattedTime, timerInterval) => {
                            console.log('Вызван обработчик завершения игры');

                            // Обновляем локальное состояние перед сохранением
                            if (typeof window.updateLocalTrainingState === 'function') {
                                try {
                                    await window.updateLocalTrainingState();
                                    console.log('Локальное состояние тренировки успешно обновлено после завершения игры');
                                } catch (error) {
                                    console.error('Ошибка при обновлении локального состояния после завершения игры:', error);
                                }
                            }

                            // Сохраняем состояние в базу данных
                            await saveTrainingState();

                            // Получаем игроков на корте
                            const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                            if (courtElement) {
                                // Получаем игроков верхней половины
                                const topPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="top"] .court-player'))
                                    .map(playerElement => {
                                        const playerId = playerElement.getAttribute('data-player-id');
                                        const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                        const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                        return { id: playerId, name: playerName, photo: playerPhoto };
                                    });

                                // Получаем игроков нижней половины
                                const bottomPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="bottom"] .court-player'))
                                    .map(playerElement => {
                                        const playerId = playerElement.getAttribute('data-player-id');
                                        const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                        const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                        return { id: playerId, name: playerName, photo: playerPhoto };
                                    });

                                // Проверяем, что на корте 4 игрока
                                if (topPlayers.length === 2 && bottomPlayers.length === 2) {
                                    // Формируем названия команд
                                    const topTeamName = `${topPlayers[0].name}/${topPlayers[1].name}`;
                                    const bottomTeamName = `${bottomPlayers[0].name}/${bottomPlayers[1].name}`;

                                    // Импортируем функцию showWinnerSelectionModal и handleWinnerSelection
                                    import('./trainings-ui.js').then(uiModule => {
                                        import('./trainings-state.js').then(stateModule => {
                                            // Показываем модальное окно выбора победителя
                                            uiModule.showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, formattedTime,
                                                (courtId, winnerTeam, topPlayers, bottomPlayers) => {
                                                    stateModule.handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers, saveTrainingState);
                                                });
                                        });
                                    });
                                } else {
                                    // Если на корте не 4 игрока, просто показываем сообщение о завершении
                                    showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');

                                    // Разблокируем изменение состава игроков
                                    unlockCourtPlayers(courtElement);
                                }
                            } else {
                                // Если не найден элемент корта, просто показываем сообщение
                                showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                            }
                        },
                        // Функция сохранения состояния
                        saveTrainingState
                    );
                });
            }
        }

        // Вызываем callback сразу после добавления в DOM
        if (callback) callback();

        // Выполняем обновление состояния в фоне
        Promise.all([
            // Удаляем игрока из очереди в локальном состоянии
            trainingStateApi.removePlayerFromQueue(trainingId, playerId),

            // Добавляем игрока на корт в локальном состоянии
            (() => {
                const slotIndex = Array.from(emptySlot.parentNode.children).indexOf(emptySlot) + 1;
                const position = `${half}${slotIndex}`;
                return trainingStateApi.addPlayerToCourt(trainingId, courtId, position, playerId);
            })()
        ]).then(() => {
            // Обновляем локальное состояние
            if (typeof window.updateLocalTrainingState === 'function') {
                window.updateLocalTrainingState().catch(error => {
                    console.error('Ошибка при обновлении локального состояния:', error);
                });
            }
        }).catch(error => {
            console.error('Ошибка при обновлении состояния:', error);
        });

        // Проверяем, остались ли еще игроки в очереди
        const remainingPlayers = document.querySelectorAll('.queue-player-card');
        if (remainingPlayers.length === 0) {
            const queueContainer = document.querySelector('.players-queue-container');
            if (queueContainer) {
                // Очищаем контейнер и добавляем сообщение
                queueContainer.innerHTML = '';
                const noPlayersMessage = document.createElement('p');
                noPlayersMessage.className = 'no-players-message';
                noPlayersMessage.textContent = 'Нет игроков в очереди';
                queueContainer.appendChild(noPlayersMessage);
            }
        }

        // Вызываем callback сразу
        if (callback) callback();

        // Не показываем сообщение о необходимости сохранить изменения
    } catch (error) {
        console.error(`Ошибка при получении данных игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при получении данных игрока', 'error');
        if (callback) callback();
    }
}

// Функция для удаления игрока с корта
export async function removePlayerFromCourt(playerElement, playerId) {
    console.log(`Удаление игрока с ID ${playerId} с корта`);

    try {
        // Получаем ID тренировки из URL
        const urlParams = new URLSearchParams(window.location.search);
        const trainingId = urlParams.get('id');

        if (!trainingId) {
            console.error('Не найден ID тренировки в URL');
            playerElement.remove();
            return;
        }

        // Находим половину корта и позицию игрока
        const courtHalf = playerElement.closest('.court-half');
        const courtContainer = playerElement.closest('.court-container');
        const courtId = courtContainer ? courtContainer.getAttribute('data-court-id') : null;
        const half = courtHalf ? courtHalf.getAttribute('data-half') : null;

        // Получаем данные игрока из элемента на корте
        const playerNameElement = playerElement.querySelector('.court-player-name');
        const playerPhotoElement = playerElement.querySelector('.court-player-photo');

        let playerLastName = '';
        let playerPhoto = '';

        if (playerNameElement) {
            playerLastName = playerNameElement.textContent.trim();
        }

        if (playerPhotoElement) {
            playerPhoto = playerPhotoElement.src;
        }

        // Если не удалось получить данные из элемента, запрашиваем из API
        let player;
        if (!playerLastName) {
            player = await playersApi.getPlayer(playerId);
            if (!player) {
                console.error(`Игрок с ID ${playerId} не найден`);
                playerElement.remove();
                return;
            }
            playerLastName = player.last_name;
            playerPhoto = player.photo;
        }

        if (courtId && half) {
            // Находим позицию игрока на корте
            const slot = playerElement.closest('.court-player-slot');
            const slotIndex = slot ? Array.from(slot.parentNode.children).indexOf(slot) + 1 : null;

            if (slotIndex) {
                const position = `${half}${slotIndex}`;
                // Удаляем игрока с корта в локальном состоянии (выполняем асинхронно)
                setTimeout(() => {
                    trainingStateApi.removePlayerFromCourt(courtId, position);
                    console.log(`Игрок удален с корта ${courtId}, позиция ${position}`);
                }, 0);
            }
        }

        // Удаляем элемент игрока сразу для мгновенной реакции
        playerElement.remove();

        // Обновляем видимость кнопок на половине корта
        if (courtHalf) {
            updateCourtHalfButtons(courtHalf);
        }

        // Обновляем видимость кнопки "Начать игру"
        if (courtContainer) {
            updateCourtVisibility(courtContainer);
        }

        // Добавляем игрока в очередь в локальном состоянии (выполняем асинхронно)
        setTimeout(() => {
            trainingStateApi.addPlayerToQueue(trainingId, playerId, 'start');
        }, 0);

        // Возвращаем игрока в очередь
        const queueContainer = document.querySelector('.players-queue-container');
        if (queueContainer) {
            // Проверяем, есть ли сообщение "Нет игроков в очереди"
            const noPlayersMessage = queueContainer.querySelector('.no-players-message');
            if (noPlayersMessage) {
                noPlayersMessage.remove();
            }

                // Формируем полное имя (используем данные, полученные ранее)
                const playerFullName = player ? `${player.last_name} ${player.first_name}` : playerLastName;

                // Определяем URL фото (используем данные, полученные ранее)
                const photoUrl = playerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;

                // Определяем класс рейтинга
                let ratingClass = 'rating-blue';
                const rating = player ? player.rating : 0;
                if (rating >= 800) {
                    ratingClass = 'rating-red';
                } else if (rating >= 600) {
                    ratingClass = 'rating-orange';
                } else if (rating >= 450) {
                    ratingClass = 'rating-yellow';
                } else if (rating >= 300) {
                    ratingClass = 'rating-green';
                }

                // Создаем карточку игрока для очереди
                const playerCard = document.createElement('div');
                playerCard.className = 'queue-player-card';
                playerCard.setAttribute('data-player-id', playerId);

                playerCard.innerHTML = `
                    <div class="queue-player-photo-container">
                        <img src="${photoUrl}" alt="${playerFullName}" class="queue-player-photo ${ratingClass}">
                    </div>
                    <div class="queue-player-info">
                        <div class="queue-player-name">${playerFullName}</div>
                        <div class="queue-player-rating">Рейтинг: ${rating}</div>
                    </div>
                `;

                // Добавляем карточку в начало очереди
                queueContainer.prepend(playerCard);

                // Добавляем класс рейтинга к фото
                const photoElement = playerCard.querySelector('.queue-player-photo');
                if (photoElement) {
                    if (rating >= 800) {
                        photoElement.classList.add('rating-red');
                    } else if (rating >= 600) {
                        photoElement.classList.add('rating-orange');
                    } else if (rating >= 450) {
                        photoElement.classList.add('rating-yellow');
                    } else if (rating >= 300) {
                        photoElement.classList.add('rating-green');
                    } else {
                        photoElement.classList.add('rating-blue');
                    }
                }
            }

        // Обновляем player_ids в таблице trainings
        try {
            const numericId = parseInt(playerId);

            // Используем промисы вместо await
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
                        // Создаем новый массив player_ids, добавляя нового игрока
                        let playerIds = trainingData.player_ids || [];

                        // Добавляем нового игрока, избегая дубликатов
                        if (!playerIds.includes(numericId)) {
                            playerIds.push(numericId);

                            // Обновляем player_ids в базе данных
                            supabase
                                .from('trainings')
                                .update({ player_ids: playerIds })
                                .eq('id', parseInt(trainingId))
                                .then(({ error: updateError }) => {
                                    if (updateError) {
                                        console.error('Ошибка при обновлении player_ids:', updateError);
                                    } else {
                                        console.log('player_ids успешно обновлены:', playerIds);
                                    }
                                });
                        }
                    }
                });
        } catch (error) {
            console.error('Ошибка при обновлении player_ids:', error);
        }

        // Обновляем локальное состояние тренировки асинхронно
        setTimeout(() => {
            if (typeof window.updateLocalTrainingState === 'function') {
                window.updateLocalTrainingState().catch(error => {
                    console.error('Ошибка при обновлении локального состояния:', error);
                });
            }
        }, 0);

        // Не показываем сообщение о необходимости сохранить изменения
    } catch (error) {
        console.error(`Ошибка при удалении игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при удалении игрока', 'error');
    }
}

// Функция для удаления игрока из очереди и с тренировки
export async function removePlayerFromTraining(playerId, trainingId) {
    console.log(`Удаление игрока с ID ${playerId} с тренировки ${trainingId}`);

    try {
        // Находим карточку игрока в очереди
        const playerCard = document.querySelector(`.queue-player-card[data-player-id="${playerId}"]`);
        if (playerCard) {
            // Удаляем игрока из очереди
            playerCard.remove();

            // Обновляем локальное состояние
            trainingStateApi.removePlayerFromQueue(trainingId, playerId);
        }

        // Находим игрока на кортах
        const courtPlayer = document.querySelector(`.court-player[data-player-id="${playerId}"]`);
        if (courtPlayer) {
            // Удаляем игрока с корта без возврата в очередь
            await removePlayerFromCourt(courtPlayer, false);
        }

        // Обновляем player_ids в таблице trainings
        try {
            // Получаем текущие player_ids
            const { data: trainingData, error: trainingError } = await supabase
                .from('trainings')
                .select('player_ids')
                .eq('id', parseInt(trainingId))
                .single();

            if (trainingError) {
                console.error('Ошибка при получении данных тренировки:', trainingError);
                return;
            }

            if (trainingData && trainingData.player_ids) {
                // Удаляем игрока из списка
                const updatedPlayerIds = trainingData.player_ids.filter(id => id !== parseInt(playerId));

                // Обновляем player_ids в базе данных
                const { error: updateError } = await supabase
                    .from('trainings')
                    .update({ player_ids: updatedPlayerIds })
                    .eq('id', parseInt(trainingId));

                if (updateError) {
                    console.error('Ошибка при обновлении player_ids:', updateError);
                } else {
                    console.log('player_ids успешно обновлены:', updatedPlayerIds);
                }
            }
        } catch (error) {
            console.error('Ошибка при обновлении player_ids:', error);
        }

        // Сохраняем состояние тренировки
        await saveTrainingState();

        return true;
    } catch (error) {
        console.error(`Ошибка при удалении игрока с ID ${playerId} с тренировки:`, error);
        showMessage('Ошибка при удалении игрока с тренировки', 'error');
        return false;
    }
}

// Функция для открытия модального окна выбора игроков для удаления с тренировки
export async function openRemovePlayersFromTrainingModal() {
    console.log('Открытие модального окна выбора игроков для удаления с тренировки');

    // Получаем ID тренировки из URL
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('id');

    if (!trainingId) {
        console.error('Не найден ID тренировки в URL');
        showMessage('Не удалось определить ID тренировки', 'error');
        return;
    }

    // Проверяем, существует ли уже модальное окно
    let removePlayersModal = document.getElementById('remove-players-from-training-modal');

    // Если модальное окно не существует, создаем его
    if (!removePlayersModal) {
        removePlayersModal = document.createElement('div');
        removePlayersModal.id = 'remove-players-from-training-modal';
        removePlayersModal.className = 'modal';

        // Добавляем модальное окно в DOM
        document.body.appendChild(removePlayersModal);
    }

    // Собираем только игроков из очереди
    const queuePlayers = [];

    // Добавляем игроков из очереди
    const queuePlayerCards = document.querySelectorAll('.queue-player-card');
    queuePlayerCards.forEach(card => {
        const playerId = card.getAttribute('data-player-id');
        const playerName = card.querySelector('.queue-player-name').textContent;
        const playerPhoto = card.querySelector('.queue-player-photo').src;
        const playerRating = card.querySelector('.queue-player-rating').textContent;

        queuePlayers.push({
            id: playerId,
            name: playerName,
            photo: playerPhoto,
            rating: playerRating,
            location: 'Очередь'
        });
    });

    // Если нет игроков в очереди, показываем сообщение
    if (queuePlayers.length === 0) {
        showMessage('В очереди нет игроков для удаления', 'warning');
        return;
    }

    // Создаем содержимое модального окна
    removePlayersModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Удалить игроков из очереди</h2>
                <button class="close-modal-btn" aria-label="Закрыть">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <div class="info-message">
                        <p>Здесь отображаются только игроки, находящиеся в очереди. Чтобы удалить игрока с корта, сначала верните его в очередь.</p>
                    </div>
                    <div id="remove-players-selection" class="players-selection">
                        ${queuePlayers.map(player => `
                            <div class="player-checkbox-item" data-player-id="${player.id}">
                                <input type="checkbox" name="selectedPlayersToRemove" value="${player.id}" id="remove-player-${player.id}">
                                <label class="player-checkbox-label" for="remove-player-${player.id}">
                                    <img src="${player.photo}" alt="${player.name}" class="player-checkbox-photo ${getRatingClass(player.rating)}">
                                    <div class="player-checkbox-info">
                                        <div class="player-checkbox-name">${player.name}</div>
                                        <div class="player-checkbox-rating">${player.rating}</div>
                                    </div>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button id="remove-selected-players-btn" class="submit-btn danger-btn">Удалить выбранных игроков</button>
            </div>
        </div>
    `;

    // Открываем модальное окно
    openModal(removePlayersModal);

    // Инициализируем иконки Feather
    if (window.feather) {
        feather.replace();
    }

    // Добавляем обработчик для кнопки закрытия
    const closeBtn = removePlayersModal.querySelector('.close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(removePlayersModal);
        });
    }

    // Добавляем обработчики для элементов выбора игрока
    const playerItems = removePlayersModal.querySelectorAll('.player-checkbox-item');
    playerItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Если клик был не на самом чекбоксе
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (e.target !== checkbox) {
                // Переключаем состояние чекбокса
                checkbox.checked = !checkbox.checked;

                // Создаем и диспатчим событие change для чекбокса
                const changeEvent = new Event('change', { bubbles: true });
                checkbox.dispatchEvent(changeEvent);

                // Предотвращаем дальнейшее всплытие события
                e.stopPropagation();
            }
        });

        // Добавляем обработчик изменения состояния чекбокса
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            // Добавляем визуальное выделение выбранного элемента
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    });

    // Добавляем обработчик для кнопки "Удалить выбранных игроков"
    const removeSelectedPlayersBtn = removePlayersModal.querySelector('#remove-selected-players-btn');
    if (removeSelectedPlayersBtn) {
        removeSelectedPlayersBtn.addEventListener('click', async () => {
            // Получаем выбранных игроков
            const selectedPlayers = Array.from(
                removePlayersModal.querySelectorAll('input[name="selectedPlayersToRemove"]:checked')
            ).map(checkbox => checkbox.value);

            if (selectedPlayers.length === 0) {
                showMessage('Выберите хотя бы одного игрока', 'warning');
                return;
            }

            // Подтверждение удаления
            if (confirm(`Вы уверены, что хотите удалить ${selectedPlayers.length} игроков с тренировки?`)) {
                // Удаляем выбранных игроков с тренировки
                for (const playerId of selectedPlayers) {
                    await removePlayerFromTraining(playerId, trainingId);
                }

                // Закрываем модальное окно
                closeModal(removePlayersModal);

                // Показываем сообщение об успехе
                showMessage(`Удалено ${selectedPlayers.length} игроков с тренировки`, 'success');
            }
        });
    }
}

// Функция для открытия модального окна выбора игроков для добавления в тренировку
export async function openAddPlayersToTrainingModal() {
    console.log('Открытие модального окна выбора игроков для добавления в тренировку');

    // Получаем ID тренировки из URL
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('id');

    if (!trainingId) {
        console.error('Не найден ID тренировки в URL');
        showMessage('Не удалось определить ID тренировки', 'error');
        return;
    }

    // Получаем модальное окно
    const modal = document.getElementById('add-players-to-training-modal');
    if (!modal) {
        console.error('Не найдено модальное окно для добавления игроков в тренировку');
        return;
    }

    // Получаем контейнер для отображения игроков
    const playersContainer = modal.querySelector('#training-players-selection');
    if (!playersContainer) {
        console.error('Не найден контейнер для отображения игроков');
        return;
    }

    // Показываем индикатор загрузки
    playersContainer.innerHTML = '<p id="training-players-loading">Загрузка списка игроков...</p>';

    try {
        // Загружаем всех игроков
        const allPlayers = await playersApi.getPlayers('name');

        // Получаем список игроков, которые уже на тренировке
        const existingPlayerIds = new Set();

        // Добавляем ID игроков из очереди
        const queuePlayerCards = document.querySelectorAll('.queue-player-card');
        queuePlayerCards.forEach(card => {
            const playerId = card.getAttribute('data-player-id');
            if (playerId) {
                existingPlayerIds.add(playerId);
            }
        });

        // Добавляем ID игроков с кортов
        const courtPlayers = document.querySelectorAll('.court-player');
        courtPlayers.forEach(player => {
            const playerId = player.getAttribute('data-player-id');
            if (playerId) {
                existingPlayerIds.add(playerId);
            }
        });

        console.log('Игроки, уже участвующие в тренировке:', existingPlayerIds);

        // Фильтруем игроков, которых еще нет на тренировке
        const availablePlayers = allPlayers.filter(player => !existingPlayerIds.has(String(player.id)));

        console.log('Доступные игроки для добавления:', availablePlayers);

        // Очищаем контейнер
        playersContainer.innerHTML = '';

        // Если нет доступных игроков, показываем сообщение
        if (availablePlayers.length === 0) {
            playersContainer.innerHTML = '<p class="text-center p-3">Все игроки уже участвуют в тренировке.</p>';
            return;
        }

        // Создаем элементы для выбора игроков
        availablePlayers.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-checkbox-item';

            // Используем дефолтное изображение, если фото не указано
            const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';

            // Создаем элементы вручную для лучшего контроля
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'selectedTrainingPlayers';
            checkbox.value = player.id;
            checkbox.id = `training-player-${player.id}`;

            const label = document.createElement('label');
            label.className = 'player-checkbox-label';
            label.htmlFor = `training-player-${player.id}`;

            const img = document.createElement('img');
            img.src = photoUrl;
            img.alt = `${player.first_name} ${player.last_name}`;

            // Определяем класс рейтинга
            let ratingClass = 'rating-blue';
            if (player.rating >= 800) {
                ratingClass = 'rating-red';
            } else if (player.rating >= 600) {
                ratingClass = 'rating-orange';
            } else if (player.rating >= 450) {
                ratingClass = 'rating-yellow';
            } else if (player.rating >= 300) {
                ratingClass = 'rating-green';
            }

            img.className = `player-checkbox-photo ${ratingClass}`;

            const infoDiv = document.createElement('div');
            infoDiv.className = 'player-checkbox-info';

            const nameDiv = document.createElement('div');
            nameDiv.className = 'player-checkbox-name';
            nameDiv.textContent = `${player.first_name} ${player.last_name}`;

            const ratingDiv = document.createElement('div');
            ratingDiv.className = 'player-checkbox-rating';
            ratingDiv.textContent = `Рейтинг: ${player.rating}`;

            // Собираем структуру
            infoDiv.appendChild(nameDiv);
            infoDiv.appendChild(ratingDiv);

            playerItem.appendChild(checkbox);
            label.appendChild(img);
            label.appendChild(infoDiv);
            playerItem.appendChild(label);

            // Добавляем обработчик клика на весь элемент
            playerItem.addEventListener('click', (e) => {
                // Если клик был не на самом чекбоксе
                if (e.target !== checkbox) {
                    // Переключаем состояние чекбокса
                    checkbox.checked = !checkbox.checked;

                    // Создаем и диспатчим событие change для чекбокса
                    const changeEvent = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(changeEvent);

                    // Предотвращаем дальнейшее всплытие события
                    e.stopPropagation();
                }
            });

            // Добавляем обработчик изменения состояния чекбокса
            checkbox.addEventListener('change', () => {
                // Добавляем визуальное выделение выбранного элемента
                if (checkbox.checked) {
                    playerItem.classList.add('selected');
                } else {
                    playerItem.classList.remove('selected');
                }
            });

            playersContainer.appendChild(playerItem);
        });

        // Добавляем обработчик для кнопки "Добавить выбранных игроков"
        const addSelectedPlayersBtn = modal.querySelector('#add-selected-players-btn');
        if (addSelectedPlayersBtn) {
            // Удаляем предыдущие обработчики
            const newBtn = addSelectedPlayersBtn.cloneNode(true);
            addSelectedPlayersBtn.parentNode.replaceChild(newBtn, addSelectedPlayersBtn);

            // Добавляем новый обработчик
            newBtn.addEventListener('click', async () => {
                // Получаем выбранных игроков
                const selectedPlayers = Array.from(
                    modal.querySelectorAll('input[name="selectedTrainingPlayers"]:checked')
                ).map(checkbox => checkbox.value);

                if (selectedPlayers.length === 0) {
                    showMessage('Выберите хотя бы одного игрока', 'warning');
                    return;
                }

                // Добавляем выбранных игроков в очередь
                for (const playerId of selectedPlayers) {
                    await addPlayerToQueue(playerId, 'end', trainingId);
                }

                // Обновляем player_ids в таблице trainings
                try {
                    // Преобразуем ID игроков в числа
                    const numericPlayerIds = selectedPlayers.map(id => parseInt(id));

                    // Используем промисы вместо await
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
                                // Создаем новый массив player_ids, добавляя новых игроков
                                let playerIds = trainingData.player_ids || [];

                                // Добавляем новых игроков, избегая дубликатов
                                numericPlayerIds.forEach(numericId => {
                                    if (!playerIds.includes(numericId)) {
                                        playerIds.push(numericId);
                                    }
                                });

                                // Обновляем player_ids в базе данных
                                supabase
                                    .from('trainings')
                                    .update({ player_ids: playerIds })
                                    .eq('id', parseInt(trainingId))
                                    .then(({ error: updateError }) => {
                                        if (updateError) {
                                            console.error('Ошибка при обновлении player_ids:', updateError);
                                        } else {
                                            console.log('player_ids успешно обновлены:', playerIds);
                                        }
                                    });
                            }
                        });
                } catch (error) {
                    console.error('Ошибка при обновлении player_ids:', error);
                }

                // Закрываем модальное окно
                closeModal(modal);

                // Показываем сообщение об успехе
                showMessage(`Добавлено ${selectedPlayers.length} игроков в тренировку`, 'success');

                // Сохраняем состояние тренировки
                if (typeof saveTrainingState === 'function') {
                    await saveTrainingState();
                }
            });
        }

        // Открываем модальное окно
        openModal(modal);

    } catch (error) {
        console.error('Ошибка при загрузке игроков:', error);
        showMessage('Не удалось загрузить список игроков', 'error');
    }
}

// Функция для добавления игрока в очередь
export async function addPlayerToQueue(playerId, position = 'end', trainingId = null) {
    console.log(`Добавление игрока с ID: ${playerId} в очередь, позиция: ${position}`);

    // Проверяем входные данные
    if (!playerId) {
        console.error('Не указан ID игрока');
        return null;
    }

    // Если trainingId не передан, получаем его из URL
    if (!trainingId) {
        const urlParams = new URLSearchParams(window.location.search);
        trainingId = urlParams.get('id');
        if (!trainingId) {
            console.error('Не найден ID тренировки в URL при добавлении игрока в очередь');
            return null;
        }
    }

    try {
        // Проверяем, есть ли уже этот игрок в очереди или на корте
        const existingQueuePlayer = document.querySelector(`.queue-player-card[data-player-id="${playerId}"]`);
        const existingCourtPlayer = document.querySelector(`.court-player[data-player-id="${playerId}"]`);

        if (existingQueuePlayer) {
            console.log(`Игрок с ID ${playerId} уже есть в очереди`);
            return null;
        }

        if (existingCourtPlayer) {
            console.log(`Игрок с ID ${playerId} уже есть на корте`);
            return null;
        }

        // Получаем данные игрока из локального хранилища или базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден`);
            return null;
        }

        console.log(`Получены данные игрока:`, player);

        // Формируем полное имя
        const playerFullName = `${player.last_name} ${player.first_name}`;

        // Получаем контейнер очереди
        const queueContainer = document.querySelector('.players-queue-container');
        if (!queueContainer) {
            console.error('Не найден контейнер очереди');
            return null;
        }

        console.log('Контейнер очереди найден:', queueContainer);

        // Проверяем, есть ли сообщение "Нет игроков в очереди"
        const noPlayersMessage = queueContainer.querySelector('.no-players-message');
        if (noPlayersMessage) {
            noPlayersMessage.remove();
        }

        // Добавляем игрока в локальное состояние
        trainingStateApi.addPlayerToQueue(trainingId, playerId, position);

        // Создаем элемент игрока в очереди
        const playerElement = document.createElement('div');
        playerElement.className = 'queue-player-card';
        playerElement.setAttribute('data-player-id', playerId);
        playerElement.setAttribute('data-player-rating', player.rating);

        // Определяем URL фото
        const photoUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;

        // Определяем класс рейтинга
        let ratingClass = 'rating-blue';
        const rating = player.rating;
        if (rating >= 800) {
            ratingClass = 'rating-red';
        } else if (rating >= 600) {
            ratingClass = 'rating-orange';
        } else if (rating >= 450) {
            ratingClass = 'rating-yellow';
        } else if (rating >= 300) {
            ratingClass = 'rating-green';
        }

        // Заполняем HTML игрока
        playerElement.innerHTML = `
            <div class="queue-player-photo-container">
                <img src="${photoUrl}" alt="${playerFullName}" class="queue-player-photo ${ratingClass}">
            </div>
            <div class="queue-player-info">
                <div class="queue-player-name">${playerFullName}</div>
                <div class="queue-player-rating">Рейтинг: ${rating}</div>
            </div>
        `;

        // Добавляем игрока в очередь в зависимости от позиции
        if (position === 'end') {
            // Добавляем в конец очереди
            queueContainer.appendChild(playerElement);
        } else {
            // Добавляем в начало очереди
            queueContainer.prepend(playerElement);
        }

        // Без анимации

        // Добавляем обработчик для перетаскивания игрока на корт
        playerElement.addEventListener('click', function() {
            console.log(`Нажат игрок в очереди: ${playerFullName} (ID: ${playerId}, рейтинг: ${rating})`);
        });

        // Не сохраняем состояние автоматически после добавления игрока в очередь
        // Сохранение будет происходить только после добавления всех игроков

        return playerElement;
    } catch (error) {
        console.error(`Ошибка при получении данных игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при получении данных игрока', 'error');
        return null;
    }
}

