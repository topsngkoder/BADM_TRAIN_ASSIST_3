// Модуль для работы с игроками и очередью
import { playersApi } from './api.js';
import { showMessage } from './ui.js';
import { updateCourtHalfButtons, updateStartGameButton, updateCourtVisibility } from './trainings-court.js';

// Функция для добавления игрока из очереди на корт
export async function addPlayerFromQueueToCourt(playerCard, courtId, half, callback, saveTrainingState) {
    // Получаем ID игрока
    const playerId = playerCard.getAttribute('data-player-id');
    console.log(`Добавление игрока с ID ${playerId} на корт ${courtId}, половина ${half}`);

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
        // Получаем актуальные данные игрока из базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден в базе данных`);
            if (callback) callback();
            return;
        }

        console.log(`Получены данные игрока из базы:`, player);

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

        // Удаляем игрока из очереди
        playerCard.classList.add('removing');

        // Обновляем очередь в sessionStorage - удаляем игрока
        updateQueueInSessionStorage(playerId, 'remove');

        setTimeout(() => {
            playerCard.remove();

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

            // Вызываем callback после завершения анимации
            if (callback) callback();
        }, 300);

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
    } catch (error) {
        console.error(`Ошибка при получении данных игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при получении данных игрока', 'error');
        if (callback) callback();
    }
}

// Функция для удаления игрока с корта
export async function removePlayerFromCourt(playerElement, playerId, saveTrainingState) {
    console.log(`Удаление игрока с ID ${playerId} с корта`);

    // Анимация удаления
    playerElement.classList.add('removing');

    try {
        // Получаем актуальные данные игрока из базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден в базе данных`);
            playerElement.remove();
            return;
        }

        console.log(`Получены данные игрока из базы:`, player);

        setTimeout(() => {
            // Находим половину корта, с которой удаляется игрок
            const courtHalf = playerElement.closest('.court-half');
            const courtContainer = playerElement.closest('.court-container');

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

                // Обновляем очередь в sessionStorage
                // При удалении игрока с корта он всегда идет в начало очереди
                updateQueueInSessionStorage(playerId, 'add', 'start');

                // Добавляем карточку в начало очереди
                queueContainer.prepend(playerCard);

                // Анимация появления
                setTimeout(() => {
                    playerCard.classList.add('added');
                    setTimeout(() => {
                        playerCard.classList.remove('added');
                    }, 300);
                }, 10);

                // Добавляем класс рейтинга к фото
                const photoElement = playerCard.querySelector('.queue-player-photo');
                if (photoElement) {
                    if (playerRating >= 800) {
                        photoElement.classList.add('rating-red');
                    } else if (playerRating >= 600) {
                        photoElement.classList.add('rating-orange');
                    } else if (playerRating >= 450) {
                        photoElement.classList.add('rating-yellow');
                    } else if (playerRating >= 300) {
                        photoElement.classList.add('rating-green');
                    } else {
                        photoElement.classList.add('rating-blue');
                    }
                }
            }
        }, 300);
    } catch (error) {
        console.error(`Ошибка при удалении игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при удалении игрока', 'error');
    }
}

// Функция для добавления игрока в очередь
export async function addPlayerToQueue(playerId, position = 'end') {
    console.log(`Добавление игрока с ID: ${playerId} в очередь`);

    // Проверяем входные данные
    if (!playerId) {
        console.error('Не указан ID игрока');
        return null;
    }

    try {
        // Получаем актуальные данные игрока из базы данных
        const player = await playersApi.getPlayer(playerId);

        if (!player) {
            console.error(`Игрок с ID ${playerId} не найден в базе данных`);
            return null;
        }

        console.log(`Получены данные игрока из базы:`, player);

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

            // Обновляем очередь в sessionStorage
            updateQueueInSessionStorage(playerId, 'add', 'end');
        } else {
            // Добавляем в начало очереди
            queueContainer.prepend(playerElement);

            // Обновляем очередь в sessionStorage
            updateQueueInSessionStorage(playerId, 'add', 'start');
        }

        // Добавляем класс для анимации
        playerElement.classList.add('added');

        // Добавляем обработчик для перетаскивания игрока на корт
        playerElement.addEventListener('click', function() {
            console.log(`Нажат игрок в очереди: ${playerFullName} (ID: ${playerId}, рейтинг: ${rating})`);
        });

        return playerElement;
    } catch (error) {
        console.error(`Ошибка при получении данных игрока с ID ${playerId}:`, error);
        showMessage('Ошибка при получении данных игрока', 'error');
        return null;
    }
}

// Функция для обновления очереди в sessionStorage
export function updateQueueInSessionStorage(playerId, action, position = null) {
    // Получаем текущую очередь из sessionStorage
    let queue = [];
    const queueJson = sessionStorage.getItem('playersQueue');

    if (queueJson) {
        try {
            queue = JSON.parse(queueJson);
        } catch (e) {
            console.error('Ошибка при парсинге очереди из sessionStorage:', e);
            queue = [];
        }
    }

    // Обновляем очередь в зависимости от действия
    if (action === 'add') {
        // Проверяем, есть ли уже игрок с таким ID в очереди
        const existingPlayerIndex = queue.findIndex(p => p.id === playerId);

        if (existingPlayerIndex !== -1) {
            // Если игрок уже есть в очереди, удаляем его
            queue.splice(existingPlayerIndex, 1);
        }

        // Добавляем ID игрока в очередь в зависимости от позиции
        if (position === 'end') {
            // Добавляем в конец очереди (победители, затем проигравшие)
            queue.push({ id: playerId });
        } else {
            // Добавляем в начало очереди (при удалении игрока с корта)
            queue.unshift({ id: playerId });
        }
    } else if (action === 'remove') {
        // Удаляем игрока из очереди
        queue = queue.filter(p => p.id !== playerId);
    }

    // Сохраняем обновленную очередь в sessionStorage
    sessionStorage.setItem('playersQueue', JSON.stringify(queue));
    console.log('Очередь обновлена в sessionStorage:', queue);
}