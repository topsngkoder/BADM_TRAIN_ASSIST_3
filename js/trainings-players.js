// Модуль для работы с игроками и очередью
import { playersApi, trainingStateApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, updateStartGameButton, updateCourtVisibility } from './trainings-court.js';

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
        // Получаем данные игрока из локального хранилища или базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден`);
            if (callback) callback();
            return;
        }

        console.log(`Получены данные игрока:`, player);

        // Формируем полное имя и получаем фамилию
        const playerFullName = `${player.last_name} ${player.first_name}`;
        const playerLastName = player.last_name;

        // Определяем URL фото
        const playerPhoto = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;

        // Определяем класс рейтинга
        let playerRatingClass = 'rating-blue';
        const rating = player.rating;
        if (rating >= 800) {
            playerRatingClass = 'rating-red';
        } else if (rating >= 600) {
            playerRatingClass = 'rating-orange';
        } else if (rating >= 450) {
            playerRatingClass = 'rating-yellow';
        } else if (rating >= 300) {
            playerRatingClass = 'rating-green';
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

        // Добавляем игрока в слот
        emptySlot.appendChild(playerElement);

        // Проверяем, заполнены ли все слоты на этой половине корта
        updateCourtHalfButtons(courtHalf);

        // Проверяем, заполнены ли все слоты на корте
        const courtContainer = courtHalf.closest('.court-container');
        if (courtContainer) {
            updateCourtVisibility(courtContainer);
        }

        // Удаляем игрока из очереди в локальном состоянии
        await trainingStateApi.removePlayerFromQueue(trainingId, playerId);

        // Добавляем игрока на корт в локальном состоянии
        const slotIndex = Array.from(emptySlot.parentNode.children).indexOf(emptySlot) + 1;
        const position = `${half}${slotIndex}`;
        await trainingStateApi.addPlayerToCourt(trainingId, courtId, position, playerId);

        // Удаляем игрока из очереди в DOM
        playerCard.remove();

        // Обновляем локальное состояние
        if (typeof window.updateLocalTrainingState === 'function') {
            window.updateLocalTrainingState().catch(error => {
                console.error('Ошибка при обновлении локального состояния:', error);
            });
        }

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

        // Инициализируем иконки Feather для новых элементов
        if (window.feather) {
            feather.replace();
        }

        // Добавляем обработчик для кнопки удаления игрока с корта
        const removeBtn = playerElement.querySelector('.remove-player-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removePlayerFromCourt(playerElement, playerId);
            });
        }

        // Показываем сообщение о необходимости сохранить изменения
        showMessage('Изменения внесены в локальное хранилище. Нажмите "Сохранить", чтобы сохранить их в базе данных.', 'info');
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

        // Получаем данные игрока из локального хранилища или базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден`);
            playerElement.remove();
            return;
        }

        console.log(`Получены данные игрока:`, player);

        // Находим половину корта и позицию игрока
        const courtHalf = playerElement.closest('.court-half');
        const courtContainer = playerElement.closest('.court-container');
        const courtId = courtContainer ? courtContainer.getAttribute('data-court-id') : null;
        const half = courtHalf ? courtHalf.getAttribute('data-half') : null;

        if (courtId && half) {
            // Находим позицию игрока на корте
            const slot = playerElement.closest('.court-player-slot');
            const slotIndex = slot ? Array.from(slot.parentNode.children).indexOf(slot) + 1 : null;

            if (slotIndex) {
                const position = `${half}${slotIndex}`;
                // Удаляем игрока с корта в локальном состоянии
                trainingStateApi.removePlayerFromCourt(courtId, position);
                console.log(`Игрок удален с корта ${courtId}, позиция ${position}`);
            }
        }

        // Добавляем игрока в очередь в локальном состоянии
        trainingStateApi.addPlayerToQueue(trainingId, playerId, 'start');

        // Удаляем элемент игрока
        playerElement.remove();

        // Обновляем видимость кнопок на половине корта
        if (courtHalf) {
            updateCourtHalfButtons(courtHalf);
        }

        // Обновляем видимость кнопки "Начать игру"
        if (courtContainer) {
            updateCourtVisibility(courtContainer);
        }

        // Возвращаем игрока в очередь
        const queueContainer = document.querySelector('.players-queue-container');
        if (queueContainer) {
            // Проверяем, есть ли сообщение "Нет игроков в очереди"
            const noPlayersMessage = queueContainer.querySelector('.no-players-message');
            if (noPlayersMessage) {
                noPlayersMessage.remove();
            }

                // Формируем полное имя
                const playerFullName = `${player.last_name} ${player.first_name}`;

                // Определяем URL фото
                const playerPhoto = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerFullName)}&background=3498db&color=fff&size=150`;

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

                // Создаем карточку игрока для очереди
                const playerCard = document.createElement('div');
                playerCard.className = 'queue-player-card';
                playerCard.setAttribute('data-player-id', playerId);

                playerCard.innerHTML = `
                    <div class="queue-player-photo-container">
                        <img src="${playerPhoto}" alt="${playerFullName}" class="queue-player-photo ${ratingClass}">
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

        // Обновляем локальное состояние тренировки
        if (typeof window.updateLocalTrainingState === 'function') {
            window.updateLocalTrainingState().catch(error => {
                console.error('Ошибка при обновлении локального состояния:', error);
            });
        }

        // Показываем сообщение о необходимости сохранить изменения
        showMessage('Изменения внесены в локальное хранилище. Нажмите "Сохранить", чтобы сохранить их в базе данных.', 'info');
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

