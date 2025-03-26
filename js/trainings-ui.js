// Модуль для работы с UI элементами тренировок
import { showMessage, openModal, closeModal } from './ui.js';

// Функция для создания карточки тренировки
export function createTrainingCard(training, onCardClick, onDeleteClick) {
    const card = document.createElement('div');
    card.className = 'training-card';

    try {
        // Проверяем наличие необходимых данных
        if (!training || !training.venue) {
            console.error('Некорректные данные тренировки:', training);
            return card; // Возвращаем пустую карточку
        }

        // Форматируем дату
        let formattedDate = 'Дата не указана';
        if (training.date) {
            try {
                const date = new Date(training.date);
                formattedDate = date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            } catch (dateError) {
                console.error('Ошибка при форматировании даты:', dateError);
            }
        }

        // Получаем список игроков
        let players = [];
        if (training.training_players && Array.isArray(training.training_players)) {
            console.log('Данные игроков в тренировке:', training.training_players);
            players = training.training_players
                .filter(tp => tp && tp.players) // Фильтруем только записи с игроками
                .map(tp => tp.players);
        } else {
            console.log('Нет данных об игроках в тренировке или неверный формат данных');
        }

        // Создаем HTML для аватаров игроков
        let playersAvatarsHTML = '';
        if (players.length > 0) {
            playersAvatarsHTML = players.map(player => {
                try {
                    if (!player || !player.first_name) return ''; // Пропускаем некорректные данные

                    const fullName = `${player.first_name} ${player.last_name || ''}`.trim();
                    const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName) + '&background=3498db&color=fff&size=150';
                    return `<img src="${photoUrl}" alt="${fullName}" class="training-player-avatar" title="${fullName}">`;
                } catch (playerError) {
                    console.error('Ошибка при обработке данных игрока:', playerError);
                    return '';
                }
            }).join('');
        }

        // Безопасно получаем количество кортов
        const courtCount = parseInt(training.court_count) || 0;

        card.innerHTML = `
            <div class="training-header">
                <div class="training-venue">${training.venue}</div>
                <div class="training-datetime">${formattedDate}, ${training.time || 'Время не указано'}</div>
                <div class="training-actions">
                    <button class="delete-btn" data-training-id="${training.id}" aria-label="Удалить тренировку">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
            <div class="training-details">
                <div class="training-courts">${courtCount} ${getCourtWord(courtCount)}</div>
                <div class="training-players-count">Игроков: ${players.length}</div>
            </div>
            <div class="training-players-list">
                ${playersAvatarsHTML}
            </div>
        `;

        // Добавляем обработчик для нажатия на карточку
        card.addEventListener('click', (e) => {
            console.log('Клик по карточке тренировки:', training.id);

            // Проверяем, не была ли нажата кнопка удаления
            if (e.target.closest('.delete-btn')) {
                console.log('Клик по кнопке удаления, игнорируем');
                return; // Не обрабатываем клик по карточке, если нажата кнопка удаления
            }

            // Добавляем визуальный эффект нажатия
            card.classList.add('selected');
            setTimeout(() => card.classList.remove('selected'), 200);

            console.log('Открываем страницу с деталями тренировки');
            // Вызываем переданный обработчик клика
            if (onCardClick) {
                onCardClick(training);
            }
        });

        // Добавляем обработчик для кнопки удаления
        const deleteBtn = card.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события клика
                if (onDeleteClick) {
                    onDeleteClick(training.id, card);
                }
            });
        }
    } catch (error) {
        console.error('Ошибка при создании карточки тренировки:', error);
        card.innerHTML = `
            <div class="training-header">
                <div class="training-venue">${training?.venue || 'Ошибка данных'}</div>
            </div>
            <div class="training-details">
                <div class="training-error">Ошибка при загрузке данных тренировки</div>
            </div>
        `;
    }

    return card;
}

// Функция для отображения модального окна выбора победителя
export function showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, gameDuration, onWinnerSelected) {
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'winner-selection-modal';

    // Создаем содержимое модального окна
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Кто победил?</h3>
                <button class="close-btn" id="close-winner-modal">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Выберите победителя (продолжительность игры: ${gameDuration})</p>
                <div class="winner-options">
                    <button class="winner-option-btn" data-team="top">
                        ${topTeamName}
                    </button>
                    <div class="winner-option-divider">или</div>
                    <button class="winner-option-btn" data-team="bottom">
                        ${bottomTeamName}
                    </button>
                </div>
            </div>
        </div>
    `;

    // Добавляем модальное окно в DOM
    document.body.appendChild(modal);

    // Инициализируем иконки Feather
    if (window.feather) {
        feather.replace();
    }

    // Показываем модальное окно
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Добавляем обработчик для закрытия модального окна
    const closeBtn = modal.querySelector('#close-winner-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });

    // Добавляем обработчики для кнопок выбора победителя
    const topTeamBtn = modal.querySelector('.winner-option-btn[data-team="top"]');
    const bottomTeamBtn = modal.querySelector('.winner-option-btn[data-team="bottom"]');

    topTeamBtn.addEventListener('click', () => {
        // Сначала закрываем модальное окно
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            // Затем обрабатываем выбор верхней команды как победителя
            if (onWinnerSelected) {
                onWinnerSelected(courtId, 'top', topPlayers, bottomPlayers);
            }
        }, 300);
    });

    bottomTeamBtn.addEventListener('click', () => {
        // Сначала закрываем модальное окно
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            // Затем обрабатываем выбор нижней команды как победителя
            if (onWinnerSelected) {
                onWinnerSelected(courtId, 'bottom', topPlayers, bottomPlayers);
            }
        }, 300);
    });
}

// Функция для открытия модального окна выбора игрока
export function openPlayerSelectionModal(courtId, half, queuePlayers, onPlayerSelected) {
    // Проверяем, существует ли уже модальное окно
    let playerSelectionModal = document.getElementById('player-selection-modal');

    // Если модальное окно не существует, создаем его
    if (!playerSelectionModal) {
        playerSelectionModal = document.createElement('div');
        playerSelectionModal.id = 'player-selection-modal';
        playerSelectionModal.className = 'modal';

        // Добавляем модальное окно в DOM
        document.body.appendChild(playerSelectionModal);
    }

    // Создаем содержимое модального окна
    playerSelectionModal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Выберите игрока</h3>
                <button class="close-btn" aria-label="Закрыть">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="players-list">
                    ${Array.from(queuePlayers).map(player => {
                        const playerId = player.getAttribute('data-player-id');
                        const playerName = player.querySelector('.queue-player-name').textContent;
                        const playerPhoto = player.querySelector('.queue-player-photo').src;

                        return `
                            <div class="player-selection-item" data-player-id="${playerId}">
                                <div class="player-selection-photo-container">
                                    <img src="${playerPhoto}" alt="${playerName}" class="player-selection-photo">
                                </div>
                                <div class="player-selection-name">${playerName}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;

    // Открываем модальное окно
    openModal(playerSelectionModal);

    // Инициализируем иконки Feather
    if (window.feather) {
        feather.replace();
    }

    // Добавляем обработчик для кнопки закрытия
    const closeBtn = playerSelectionModal.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(playerSelectionModal);
        });
    }

    // Добавляем обработчики для элементов выбора игрока
    const playerItems = playerSelectionModal.querySelectorAll('.player-selection-item');
    playerItems.forEach(item => {
        item.addEventListener('click', () => {
            const playerId = item.getAttribute('data-player-id');
            console.log(`Выбран игрок с ID ${playerId} для добавления на корт ${courtId}, половина ${half}`);

            // Находим карточку игрока в очереди
            const playerCard = document.querySelector(`.queue-player-card[data-player-id="${playerId}"]`);
            if (playerCard) {
                // Вызываем переданный обработчик выбора игрока
                if (onPlayerSelected) {
                    onPlayerSelected(playerCard, courtId, half);
                }

                // Закрываем модальное окно
                closeModal(playerSelectionModal);
            } else {
                console.error(`Не найдена карточка игрока с ID ${playerId}`);
            }
        });
    });
}

// Функция для склонения слова "корт"
export function getCourtWord(count) {
    if (count === 1) {
        return 'корт';
    } else if (count >= 2 && count <= 4) {
        return 'корта';
    } else {
        return 'кортов';
    }
}