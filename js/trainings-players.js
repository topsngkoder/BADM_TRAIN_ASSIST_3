// Модуль для работы с игроками и очередью
import { playersApi, trainingStateApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, updateStartGameButton, updateCourtVisibility, startGameTimer, unlockCourtPlayers } from './trainings-court.js';
import { saveTrainingState } from './trainings-state.js';

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

                            // Показываем сообщение о завершении игры
                            showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');

                            // Разблокируем изменение состава игроков
                            const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                            if (courtElement) {
                                unlockCourtPlayers(courtElement);
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

