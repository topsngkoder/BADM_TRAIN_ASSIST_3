// Основной модуль для работы с тренировками
import { trainingsApi, playersApi, trainingStateApi } from './api.js';
import { showMessage } from './ui.js';
import { createTrainingCard, getCourtWord } from './trainings-ui.js';
import { initTrainingHandlers, handleDeleteTraining, initTrainingDetailsHandlers } from './trainings-handlers.js';
import { loadTrainingState, saveTrainingState, updateLocalTrainingState } from './trainings-state.js';
import { updateCourtHalfButtons, updateStartGameButton, startGameTimer, unlockCourtPlayers } from './trainings-court.js';
import { removePlayerFromCourt } from './trainings-players.js';

// Делаем функцию updateLocalTrainingState доступной глобально
window.updateLocalTrainingState = updateLocalTrainingState;

// Инициализация модуля тренировок
export function initTrainingsModule() {
    console.log('Инициализация модуля  тренировок');

    // DOM элементы
    const addTrainingBtn = document.getElementById('add-training-btn');
    console.log('Кнопка добавления тренировки:', addTrainingBtn);

    const addTrainingModal = document.getElementById('add-training-modal');
    console.log('Модальное окно добавления тренировки:', addTrainingModal);

    const addTrainingForm = document.getElementById('add-training-form');
    console.log('Форма добавления тренировки:', addTrainingForm);
    
    const trainingsContainer = document.getElementById('trainings-container');
    console.log('Контейнер тренировок:', trainingsContainer);

    const playersSelection = document.getElementById('players-selection');
    console.log('Контейнер выбора игроков:', playersSelection);

    // Проверяем наличие страницы деталей тренировки
    const trainingDetailsSection = document.getElementById('training-details-section');
    console.log('Страница деталей тренировки:', trainingDetailsSection);

    // Проверяем наличие кнопки "Назад"
    const backBtn = document.getElementById('back-to-trainings-btn');
    console.log('Кнопка "Назад":', backBtn);

    // Добавляем обработчик для кнопки "Назад"
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            console.log('Нажата кнопка "Назад"');

            // Скрываем интерфейс деталей тренировки
            const trainingDetailsInterface = document.getElementById('training-details-interface');
            if (trainingDetailsInterface) {
                trainingDetailsInterface.style.display = 'none';
            }

            // Показываем основной интерфейс
            const mainInterface = document.getElementById('main-interface');
            if (mainInterface) {
                mainInterface.style.display = 'block';
            }

            // Сбрасываем состояние экрана загрузки для следующего открытия
            const loadingScreen = document.getElementById('training-details-loading');
            const detailsContainer = document.getElementById('training-details-container');

            if (loadingScreen) loadingScreen.style.display = 'flex';
            if (detailsContainer) detailsContainer.style.display = 'none';

            // Очищаем URL
            const url = new URL(window.location);
            url.searchParams.delete('id');
            window.history.pushState({}, '', url);
        });
    }

    // Функция для загрузки тренировок
    async function fetchTrainings(container = trainingsContainer) {
        console.log('Загрузка тренировок');
        try {
            // Получаем тренировки
            const trainings = await trainingsApi.getTrainings();
            console.log('Получены тренировки:', trainings);

            // Очистка контейнера
            console.log('Очистка контейнера тренировок');
            container.innerHTML = '';

            // Если тренировок нет, показываем сообщение
            if (trainings.length === 0) {
                console.log('Тренировок нет, показываем сообщение');
                container.innerHTML = '<p>У вас пока нет тренировок.</p>';
                return;
            }

            // Отображение каждой тренировки
            console.log('Отображение тренировок');
            trainings.forEach(training => {
                console.log('Создание карточки для тренировки:', training.id);
                const trainingCard = createTrainingCard(
                    training,
                    // Обработчик клика по карточке
                    (training) => {
                        openTrainingDetails(training);
                    },
                    // Обработчик удаления тренировки
                    (trainingId, card) => {
                        handleDeleteTraining(trainingId, card, container);
                    }
                );
                container.appendChild(trainingCard);
            });

            // Инициализируем иконки Feather после добавления всех карточек в DOM
            console.log('Инициализация иконок Feather');
            if (window.feather) {
                console.log('Feather доступен, инициализируем иконки');
                feather.replace();
            } else {
                console.error('Feather не доступен');
            }
        } catch (error) {
            console.error('Ошибка при загрузке тренировок:', error);
            container.innerHTML = '<p>Произошла ошибка при загрузке тренировок. Пожалуйста, попробуйте позже.</p>';
            showMessage('Ошибка при загрузке тренировок', 'error');
        }
    }

    // Инициализация обработчиков
    console.log('Инициализация обработчиков');
    initTrainingHandlers({
        addTrainingBtn,
        addTrainingForm,
        playersSelection,
        addTrainingModal,
        trainingsContainer,
        fetchTrainings: () => fetchTrainings(trainingsContainer)
    });

    // Загрузка тренировок
    console.log('Загрузка тренировок');
    fetchTrainings(trainingsContainer);

    // Проверяем, есть ли ID тренировки в URL (если пользователь обновил страницу)
    const urlParams = new URLSearchParams(window.location.search);
    const trainingId = urlParams.get('id');
    console.log('ID тренировки из URL:', trainingId);

    if (trainingId) {
        console.log('Загрузка тренировки по ID из URL:', trainingId);
        // Загружаем данные тренировки и открываем страницу деталей
        trainingsApi.getTrainingById(parseInt(trainingId))
            .then(training => {
                console.log('Получена тренировка по ID:', training);
                if (training) {
                    console.log('Открытие страницы деталей тренировки');
                    openTrainingDetails(training);
                } else {
                    console.log('Тренировка не найдена, очищаем URL');
                    // Если тренировка не найдена, очищаем URL
                    const url = new URL(window.location);
                    url.searchParams.delete('id');
                    window.history.pushState({}, '', url);
                    showMessage('Тренировка не найдена в базе данных', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке тренировки:', error);
                // Очищаем URL
                const url = new URL(window.location);
                url.searchParams.delete('id');
                window.history.pushState({}, '', url);
                showMessage('Ошибка при загрузке тренировки из базы данных', 'error');
            });
    }

    // Функция для открытия страницы с деталями тренировки
    async function openTrainingDetails(training) {
        console.log('Открытие деталей тренировки:', training);

        // Добавляем ID тренировки в URL
        const url = new URL(window.location);
        url.searchParams.set('id', training.id);
        window.history.pushState({}, '', url);

        // Скрываем основной интерфейс и показываем интерфейс деталей тренировки
        console.log('Скрываем основной интерфейс и показываем интерфейс деталей тренировки');

        const mainInterface = document.getElementById('main-interface');
        console.log('Основной интерфейс:', mainInterface);
        if (mainInterface) {
            mainInterface.style.display = 'none';
            console.log('Основной интерфейс скрыт');
        } else {
            console.error('Не найден основной интерфейс с ID "main-interface"');
        }

        const trainingDetailsInterface = document.getElementById('training-details-interface');
        console.log('Интерфейс деталей тренировки:', trainingDetailsInterface);
        if (trainingDetailsInterface) {
            // Показываем интерфейс деталей тренировки
            trainingDetailsInterface.style.display = 'block';
            trainingDetailsInterface.style.width = '100%';
            trainingDetailsInterface.style.maxWidth = '100%';
            console.log('Интерфейс деталей тренировки показан');

            // Показываем экран загрузки и скрываем контейнер с деталями
            const loadingScreen = document.getElementById('training-details-loading');
            const detailsContainer = document.getElementById('training-details-container');

            if (loadingScreen) loadingScreen.style.display = 'flex';
            if (detailsContainer) detailsContainer.style.display = 'none';
        } else {
            console.error('Не найден интерфейс деталей тренировки с ID "training-details-interface"');
        }

        // Переменная для хранения состояния тренировки
        let stateData = null;

        try {
            // Загружаем состояние тренировки
            stateData = await loadTrainingState(training.id);
            console.log('Состояние тренировки загружено:', stateData);
        } catch (error) {
            console.error('Ошибка при загрузке состояния тренировки:', error);
            showMessage('Не удалось загрузить тренировку из базы данных', 'error');

            // Продолжаем выполнение функции, чтобы отобразить хотя бы базовую информацию о тренировке
            console.log('Продолжаем отображение деталей тренировки без загруженного состояния');
        }

        // Получаем элементы страницы
        const titleElement = document.getElementById('training-title');
        const detailsContainer = document.getElementById('training-details-container');

        // Очищаем контейнер деталей перед загрузкой новых данных
        if (detailsContainer) {
            detailsContainer.innerHTML = '';
        }

        // Получаем или создаем элемент для режима тренировки
        let trainingModeElement = document.getElementById('training-mode-selector');
        if (!trainingModeElement) {
            trainingModeElement = document.createElement('div');
            trainingModeElement.id = 'training-mode-selector';
            trainingModeElement.className = 'training-mode-selector';

            // Добавляем элемент после заголовка
            titleElement.parentNode.insertBefore(trainingModeElement, titleElement.nextSibling);
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

        // Устанавливаем заголовок страницы в более компактном формате
        titleElement.textContent = `${training.venue} ${formattedDate}`;

        // Заполняем селектор режима тренировки
        trainingModeElement.innerHTML = `
            <label for="training-mode">Режим тренировки:</label>
            <select id="training-mode" class="training-mode-select">
                <option value="max-two-wins">Не больше двух побед</option>
                <option value="single">Играем один раз</option>
                <option value="winner-stays">Победитель остается всегда</option>
            </select>
        `;

        // Добавляем обработчик изменения режима тренировки
        const trainingModeSelect = trainingModeElement.querySelector('#training-mode');
        if (trainingModeSelect) {
            trainingModeSelect.addEventListener('change', (e) => {
                const selectedMode = e.target.value;
                console.log('Выбран режим тренировки:', selectedMode);

                // Импортируем функцию updateLocalTrainingStateOnly
                import('./trainings-state.js').then(stateModule => {
                    if (typeof stateModule.updateLocalTrainingStateOnly === 'function') {
                        stateModule.updateLocalTrainingStateOnly().catch(error => {
                            console.error('Ошибка при обновлении локального состояния:', error);
                        });
                    }
                });
            });
        }

        // Очищаем контейнер деталей
        detailsContainer.innerHTML = '';

        // Создаем содержимое страницы
        const content = document.createElement('div');
        content.className = 'training-details-content';

        // Получаем список игроков для тренировки
        let players = [];

        // Состояние тренировки уже загружено выше

        if (stateData && stateData.playersQueue && stateData.playersQueue.length > 0) {
            // Если есть сохраненная очередь игроков в состоянии, используем ее
            console.log('Используем сохраненную очередь игроков из состояния:', stateData.playersQueue);

            // Получаем полные данные игроков для каждого ID в очереди
            const playersQueue = [];

            for (const playerItem of stateData.playersQueue) {
                const playerId = playerItem.id || playerItem;
                try {
                    const playerData = await playersApi.getPlayer(playerId);
                    if (playerData) {
                        playersQueue.push(playerData);
                    } else {
                        console.warn(`Не удалось получить данные игрока с ID ${playerId}`);
                    }
                } catch (error) {
                    console.error(`Ошибка при получении данных игрока с ID ${playerId}:`, error);
                }
            }

            console.log('Полученные данные игроков для очереди:', playersQueue);
            players = playersQueue;
        } else {
            // Если нет сохраненной очереди, используем список игроков из тренировки
            if (training.training_players && Array.isArray(training.training_players)) {
                players = training.training_players
                    .filter(tp => tp && tp.players) // Фильтруем только записи с игроками
                    .map(tp => tp.players);
            }

            // Сортируем игроков по рейтингу
            players.sort((a, b) => {
                const ratingA = parseInt(a.rating) || 0;
                const ratingB = parseInt(b.rating) || 0;
                return ratingB - ratingA; // Сортировка по убыванию
            });
            console.log('Отсортированные игроки по рейтингу для начальной очереди:', players);

            // Сохраняем начальную очередь в локальное хранилище
            if (players.length > 0) {
                const playerIds = players.map(player => ({ id: String(player.id) }));
                trainingStateApi._localState.playersQueue = playerIds;
                console.log('Сохранена начальная очередь в локальное хранилище:', playerIds);
            }
        }

        // Создаем HTML для игроков в очереди
        let playersQueueHTML = '';
        if (players.length > 0) {
            playersQueueHTML = players.map(player => {
                // Проверяем, является ли player объектом с id или полным объектом игрока
                if (player && typeof player === 'object' && 'id' in player && !player.first_name) {
                    // Это объект с id из очереди в состоянии тренировки
                    // Используем заглушку, пока не загрузятся полные данные
                    const playerId = player.id;
                    return `
                        <div class="queue-player-card" data-player-id="${playerId}">
                            <div class="queue-player-photo-container">
                                <img src="https://ui-avatars.com/api/?name=Loading&background=3498db&color=fff&size=150" alt="Loading" class="queue-player-photo">
                            </div>
                            <div class="queue-player-info">
                                <div class="queue-player-name">Загрузка...</div>
                                <div class="queue-player-rating">Рейтинг: -</div>
                            </div>
                        </div>
                    `;
                }

                // Проверяем наличие данных игрока
                if (!player || !player.first_name) return '';

                // Формируем полное имя
                const fullName = `${player.last_name || ''} ${player.first_name || ''}`.trim();

                // Получаем URL фото или используем заглушку
                const photoUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3498db&color=fff&size=150`;

                // Определяем класс рейтинга
                let ratingClass = 'rating-blue';
                const rating = parseInt(player.rating) || 0;
                if (rating >= 800) {
                    ratingClass = 'rating-red';
                } else if (rating >= 600) {
                    ratingClass = 'rating-orange';
                } else if (rating >= 450) {
                    ratingClass = 'rating-yellow';
                } else if (rating >= 300) {
                    ratingClass = 'rating-green';
                }

                // Добавляем рейтинг в карточку игрока
                const ratingDisplay = rating > 0 ? rating : 'Нет';

                // Возвращаем HTML для карточки игрока в очереди
                return `
                    <div class="queue-player-card" data-player-id="${player.id}" data-player-rating="${rating}">
                        <div class="queue-player-photo-container">
                            <img src="${photoUrl}" alt="${fullName}" class="queue-player-photo ${ratingClass}">
                        </div>
                        <div class="queue-player-info">
                            <div class="queue-player-name">${fullName}</div>
                            <div class="queue-player-rating">Рейтинг: ${ratingDisplay}</div>
                        </div>
                    </div>
                `;
            }).join('');

            // После создания HTML, загружаем полные данные игроков для карточек с заглушками
            setTimeout(async () => {
                const playerCards = document.querySelectorAll('.queue-player-card');
                for (const card of playerCards) {
                    const playerId = card.getAttribute('data-player-id');
                    if (card.querySelector('.queue-player-name').textContent === 'Загрузка...') {
                        try {
                            const playerData = await playersApi.getPlayer(playerId);
                            if (playerData) {
                                // Формируем полное имя
                                const fullName = `${playerData.last_name || ''} ${playerData.first_name || ''}`.trim();

                                // Получаем URL фото или используем заглушку
                                const photoUrl = playerData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3498db&color=fff&size=150`;

                                // Определяем класс рейтинга
                                let ratingClass = 'rating-blue';
                                const rating = parseInt(playerData.rating) || 0;
                                if (rating >= 800) {
                                    ratingClass = 'rating-red';
                                } else if (rating >= 600) {
                                    ratingClass = 'rating-orange';
                                } else if (rating >= 450) {
                                    ratingClass = 'rating-yellow';
                                } else if (rating >= 300) {
                                    ratingClass = 'rating-green';
                                }

                                // Обновляем карточку игрока
                                card.setAttribute('data-player-rating', rating);
                                card.querySelector('.queue-player-photo').src = photoUrl;
                                card.querySelector('.queue-player-photo').alt = fullName;
                                card.querySelector('.queue-player-photo').className = `queue-player-photo ${ratingClass}`;
                                card.querySelector('.queue-player-name').textContent = fullName;
                                card.querySelector('.queue-player-rating').textContent = `Рейтинг: ${rating > 0 ? rating : 'Нет'}`;
                            }
                        } catch (error) {
                            console.error(`Ошибка при загрузке данных игрока с ID ${playerId}:`, error);
                        }
                    }
                }
            }, 100);
        }

        // Если игроков нет, показываем сообщение
        if (!playersQueueHTML) {
            playersQueueHTML = '<p class="no-players-message">Нет игроков в очереди</p>';
        }

        // Создаем HTML для кортов
        let courtsHTML = '';
        const courtCount = parseInt(training.court_count) || 1;

        for (let i = 1; i <= courtCount; i++) {
            courtsHTML += `
                <div class="court-container" data-court-id="${i}" style="margin-bottom: 20px; width: 100%; display: block;">
                    <div class="court-header">
                        <h4>Корт ${i}</h4>
                        <button class="remove-court-btn" data-court-id="${i}" aria-label="Удалить корт" title="Удалить корт">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                    <div class="court-body">
                        <div class="court-half top-half" data-court="${i}" data-half="top">
                            <div class="court-players">
                                <div class="court-player-slot" data-slot="1"></div>
                                <div class="court-player-slot" data-slot="2"></div>
                            </div>
                            <div class="court-actions">
                                <button class="court-action-btn add-from-queue-btn" data-court="${i}" data-half="top" aria-label="Добавить из очереди">
                                    <i data-feather="user-plus"></i> Из очереди
                                </button>
                                <button class="court-action-btn add-player-btn" data-court="${i}" data-half="top" aria-label="Добавить игрока">
                                    <i data-feather="plus"></i>
                                </button>
                            </div>
                        </div>
                        <div class="court-divider"></div>
                        <div class="court-half bottom-half" data-court="${i}" data-half="bottom">
                            <div class="court-players">
                                <div class="court-player-slot" data-slot="1"></div>
                                <div class="court-player-slot" data-slot="2"></div>
                            </div>
                            <div class="court-actions">
                                <button class="court-action-btn add-from-queue-btn" data-court="${i}" data-half="bottom" aria-label="Добавить из очереди">
                                    <i data-feather="user-plus"></i> Из очереди
                                </button>
                                <button class="court-action-btn add-player-btn" data-court="${i}" data-half="bottom" aria-label="Добавить игрока">
                                    <i data-feather="plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Добавляем очередь игроков над кортами в вертикальный макет
        content.innerHTML = `
            <div class="training-layout vertical">
                <div class="players-queue-section">
                    <div class="players-queue-header">
                        <h4>Очередь игроков</h4>
                        <div class="queue-actions">
                            <button id="add-players-to-training-btn" class="section-action-btn" aria-label="Добавить игроков в тренировку">
                                <i data-feather="user-plus"></i>
                            </button>
                            <button id="remove-players-from-training-btn" class="section-action-btn" aria-label="Удалить игроков с тренировки">
                                <i data-feather="user-minus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="players-queue-container horizontal">
                        ${playersQueueHTML}
                    </div>
                </div>
                <div class="courts-section" style="width: 100%; height: auto; min-height: 500px; display: flex; flex-direction: column;">
                    <div class="courts-container" style="display: flex; flex-direction: column; width: 100%; overflow-y: auto; max-height: none; padding-bottom: 50px;">
                        ${courtsHTML}
                        <button id="add-court-btn" class="add-court-btn">
                            <i data-feather="plus-circle"></i> Добавить корт
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Добавляем содержимое в контейнер
        detailsContainer.appendChild(content);

        // Добавляем обработчики для кнопок и карточек игроков
        setTimeout(() => {
            // Добавляем обработчик для кнопки добавления игроков в тренировку
            const addPlayersBtn = detailsContainer.querySelector('#add-players-to-training-btn');
            if (addPlayersBtn) {
                addPlayersBtn.addEventListener('click', () => {
                    console.log('Нажата кнопка добавления игроков в тренировку');
                    // Импортируем функцию динамически, чтобы избежать циклических зависимостей
                    import('./trainings-players.js').then(module => {
                        module.openAddPlayersToTrainingModal();
                    });
                });
            }

            // Добавляем обработчик для кнопки удаления игроков с тренировки
            const removePlayersBtn = detailsContainer.querySelector('#remove-players-from-training-btn');
            if (removePlayersBtn) {
                removePlayersBtn.addEventListener('click', () => {
                    console.log('Нажата кнопка удаления игроков с тренировки');
                    // Импортируем функцию динамически, чтобы избежать циклических зависимостей
                    import('./trainings-players.js').then(module => {
                        module.openRemovePlayersFromTrainingModal();
                    });
                });
            }

            // Добавляем обработчики для кнопок удаления кортов
            const removeCourtBtns = detailsContainer.querySelectorAll('.remove-court-btn');
            removeCourtBtns.forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const courtId = btn.getAttribute('data-court-id');
                    const courtContainer = document.querySelector(`.court-container[data-court-id="${courtId}"]`);

                    // Получаем все корты
                    const allCourts = document.querySelectorAll('.court-container');
                    const totalCourts = allCourts.length;

                    // Проверяем, является ли удаляемый корт последним
                    if (parseInt(courtId) !== totalCourts) {
                        console.log(`Корт ${courtId} не является последним. Можно удалить только последний корт.`);
                        showMessage(`Можно удалить только последний корт (Корт ${totalCourts})`, 'warning');
                        return;
                    }

                    // Проверяем, пустой ли корт
                    const courtPlayers = courtContainer.querySelectorAll('.court-player');
                    if (courtPlayers.length > 0) {
                        showMessage('Нельзя удалить корт с игроками. Сначала удалите всех игроков с корта.', 'warning');
                        return;
                    }

                    // Запрашиваем подтверждение удаления
                    if (confirm(`Вы уверены, что хотите удалить корт ${courtId}?`)) {
                        try {
                            // Получаем ID тренировки из URL
                            const urlParams = new URLSearchParams(window.location.search);
                            const trainingId = urlParams.get('id');

                            if (!trainingId) {
                                console.error('Не найден ID тренировки в URL');
                                return;
                            }

                            // Подсчитываем количество оставшихся кортов (текущее - 1)
                            const remainingCourts = document.querySelectorAll('.court-container').length - 1;

                            // Сначала обновляем количество кортов в базе данных
                            const updatedTraining = await trainingsApi.updateTraining(trainingId, { court_count: remainingCourts });
                            console.log(`Количество кортов в базе данных обновлено: ${remainingCourts}`);

                            // Обрабатываем удаление корта из состояния тренировки
                            try {
                                // Проверяем, инициализировано ли локальное хранилище
                                if (trainingStateApi._localState.trainingId !== parseInt(trainingId)) {
                                    trainingStateApi.initLocalState(parseInt(trainingId));
                                }

                                // Удаляем корт из состояния (теперь мы знаем, что это последний корт)
                                trainingStateApi._localState.courts = trainingStateApi._localState.courts.filter(court => court.id !== String(courtId));
                                console.log(`Корт ${courtId} удален из состояния тренировки`);

                                // Обновляем количество кортов в состоянии
                                trainingStateApi._localState.courtCount = remainingCourts;
                                trainingStateApi._localState.lastUpdated = new Date().toISOString();

                                // Обновляем локальное хранилище
                                await updateLocalTrainingState();
                                console.log(`Локальное состояние тренировки после удаления корта ${courtId} обновлено`);

                                // Сохраняем обновленное состояние в базу данных
                                await saveTrainingState();
                                console.log(`Состояние тренировки после удаления корта ${courtId} сохранено в базу данных`);
                            } catch (stateError) {
                                console.error(`Ошибка при обновлении состояния тренировки после удаления корта ${courtId}:`, stateError);
                            }

                            // Если обновление прошло успешно, перезагружаем страницу деталей тренировки
                            if (updatedTraining && updatedTraining.length > 0) {
                                // Получаем полные данные тренировки
                                const fullTraining = await trainingsApi.getTrainingById(parseInt(trainingId));
                                if (fullTraining) {
                                    // Удаляем корт из DOM
                                    courtContainer.remove();

                                    // Перезагружаем детали тренировки
                                    openTrainingDetails(fullTraining);
                                    showMessage(`Корт ${courtId} успешно удален`, 'success');
                                    return; // Прерываем выполнение функции, так как страница будет перезагружена
                                }
                            }

                            // Затем удаляем корт из DOM
                            courtContainer.remove();

                            // Обновляем локальное состояние
                            if (typeof window.updateLocalTrainingState === 'function') {
                                await window.updateLocalTrainingState();
                            }

                            // Сохраняем состояние в базу данных
                            await saveTrainingState();

                            // Показываем сообщение об успехе
                            showMessage(`Корт ${courtId} успешно удален`, 'success');
                        } catch (error) {
                            console.error('Ошибка при удалении корта:', error);
                            showMessage('Ошибка при удалении корта', 'error');
                        }
                    }
                });
            });

            // Добавляем обработчик для кнопки добавления корта
            const addCourtBtn = detailsContainer.querySelector('#add-court-btn');
            if (addCourtBtn) {
                addCourtBtn.addEventListener('click', async () => {
                    try {
                        // Получаем ID тренировки из URL
                        const urlParams = new URLSearchParams(window.location.search);
                        const trainingId = urlParams.get('id');

                        if (!trainingId) {
                            console.error('Не найден ID тренировки в URL');
                            return;
                        }

                        // Получаем текущее количество кортов
                        const currentCourtCount = document.querySelectorAll('.court-container').length;
                        const newCourtCount = currentCourtCount + 1;
                        const newCourtId = newCourtCount;

                        // Обновляем количество кортов в базе данных
                        const updatedTraining = await trainingsApi.updateTraining(trainingId, { court_count: newCourtCount });
                        console.log(`Количество кортов в базе данных обновлено: ${newCourtCount}`);

                        // Добавляем новый корт в состояние тренировки
                        try {
                            // Проверяем, инициализировано ли локальное хранилище
                            if (trainingStateApi._localState.trainingId !== parseInt(trainingId)) {
                                trainingStateApi.initLocalState(parseInt(trainingId));
                            }

                            // Добавляем новый корт в состояние
                            const newCourt = {
                                id: String(newCourtId),
                                name: `Корт ${newCourtId}`,
                                gameInProgress: false,
                                topPlayers: [],
                                bottomPlayers: [],
                                gameStartTime: null
                            };

                            // Проверяем, есть ли уже такой корт в состоянии
                            const existingCourtIndex = trainingStateApi._localState.courts.findIndex(court => court.id === String(newCourtId));
                            if (existingCourtIndex === -1) {
                                // Добавляем новый корт в состояние
                                trainingStateApi._localState.courts.push(newCourt);
                                console.log(`Корт ${newCourtId} добавлен в состояние тренировки`);
                            }

                            // Обновляем количество кортов в состоянии
                            trainingStateApi._localState.courtCount = newCourtCount;
                            trainingStateApi._localState.lastUpdated = new Date().toISOString();

                            // Обновляем локальное хранилище
                            await updateLocalTrainingState();
                            console.log(`Локальное состояние тренировки с новым кортом ${newCourtId} обновлено`);

                            // Сохраняем обновленное состояние в базу данных
                            await saveTrainingState();
                            console.log(`Состояние тренировки с новым кортом ${newCourtId} сохранено в базу данных`);
                        } catch (stateError) {
                            console.error(`Ошибка при обновлении состояния тренировки с новым кортом ${newCourtId}:`, stateError);
                        }

                        // Если обновление прошло успешно, перезагружаем страницу деталей тренировки
                        if (updatedTraining && updatedTraining.length > 0) {
                            // Получаем полные данные тренировки
                            const fullTraining = await trainingsApi.getTrainingById(parseInt(trainingId));
                            if (fullTraining) {
                                // Перезагружаем детали тренировки
                                openTrainingDetails(fullTraining);
                                showMessage(`Корт ${newCourtId} успешно добавлен`, 'success');
                                return; // Прерываем выполнение функции, так как страница будет перезагружена
                            }
                        }

                        // Создаем HTML для нового корта
                        const newCourtHTML = `
                            <div class="court-container" data-court-id="${newCourtId}" style="margin-bottom: 20px; width: 100%; display: block;">
                                <div class="court-header">
                                    <h4>Корт ${newCourtId}</h4>
                                    <button class="remove-court-btn" data-court-id="${newCourtId}" aria-label="Удалить корт" title="Удалить корт">
                                        <i data-feather="trash-2"></i>
                                    </button>
                                </div>
                                <div class="court-body">
                                    <div class="court-half top-half" data-court="${newCourtId}" data-half="top">
                                        <div class="court-players">
                                            <div class="court-player-slot" data-slot="1"></div>
                                            <div class="court-player-slot" data-slot="2"></div>
                                        </div>
                                        <div class="court-actions">
                                            <button class="court-action-btn add-from-queue-btn" data-court="${newCourtId}" data-half="top" aria-label="Добавить из очереди">
                                                <i data-feather="user-plus"></i> Из очереди
                                            </button>
                                            <button class="court-action-btn add-player-btn" data-court="${newCourtId}" data-half="top" aria-label="Добавить игрока">
                                                <i data-feather="plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="court-divider"></div>
                                    <div class="court-half bottom-half" data-court="${newCourtId}" data-half="bottom">
                                        <div class="court-players">
                                            <div class="court-player-slot" data-slot="1"></div>
                                            <div class="court-player-slot" data-slot="2"></div>
                                        </div>
                                        <div class="court-actions">
                                            <button class="court-action-btn add-from-queue-btn" data-court="${newCourtId}" data-half="bottom" aria-label="Добавить из очереди">
                                                <i data-feather="user-plus"></i> Из очереди
                                            </button>
                                            <button class="court-action-btn add-player-btn" data-court="${newCourtId}" data-half="bottom" aria-label="Добавить игрока">
                                                <i data-feather="plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;

                        // Создаем элемент корта
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = newCourtHTML.trim();
                        const newCourtElement = tempDiv.firstChild;

                        // Добавляем новый корт перед кнопкой "Добавить корт"
                        const courtsContainer = detailsContainer.querySelector('.courts-container');
                        courtsContainer.insertBefore(newCourtElement, addCourtBtn);

                        // Инициализируем иконки Feather для нового корта
                        if (window.feather) {
                            feather.replace(newCourtElement.querySelectorAll('[data-feather]'));
                        }

                        // Добавляем обработчик для кнопки удаления нового корта
                        const newRemoveBtn = newCourtElement.querySelector('.remove-court-btn');
                        if (newRemoveBtn) {
                            newRemoveBtn.addEventListener('click', async (e) => {
                                e.stopPropagation();
                                const courtId = newRemoveBtn.getAttribute('data-court-id');
                                const courtContainer = document.querySelector(`.court-container[data-court-id="${courtId}"]`);

                                // Получаем все корты
                                const allCourts = document.querySelectorAll('.court-container');
                                const totalCourts = allCourts.length;

                                // Проверяем, является ли удаляемый корт последним
                                if (parseInt(courtId) !== totalCourts) {
                                    console.log(`Корт ${courtId} не является последним. Можно удалить только последний корт.`);
                                    showMessage(`Можно удалить только последний корт (Корт ${totalCourts})`, 'warning');
                                    return;
                                }

                                // Проверяем, пустой ли корт
                                const courtPlayers = courtContainer.querySelectorAll('.court-player');
                                if (courtPlayers.length > 0) {
                                    showMessage('Нельзя удалить корт с игроками. Сначала удалите всех игроков с корта.', 'warning');
                                    return;
                                }

                                // Запрашиваем подтверждение удаления
                                if (confirm(`Вы уверены, что хотите удалить корт ${courtId}?`)) {
                                    try {
                                        // Подсчитываем количество оставшихся кортов (текущее - 1)
                                        const remainingCourts = document.querySelectorAll('.court-container').length - 1;

                                        // Сначала обновляем количество кортов в базе данных
                                        const updatedTraining = await trainingsApi.updateTraining(trainingId, { court_count: remainingCourts });
                                        console.log(`Количество кортов в базе данных обновлено: ${remainingCourts}`);

                                        // Обрабатываем удаление корта из состояния тренировки
                                        try {
                                            // Проверяем, инициализировано ли локальное хранилище
                                            if (trainingStateApi._localState.trainingId !== parseInt(trainingId)) {
                                                trainingStateApi.initLocalState(parseInt(trainingId));
                                            }

                                            // Удаляем корт из состояния (теперь мы знаем, что это последний корт)
                                            trainingStateApi._localState.courts = trainingStateApi._localState.courts.filter(court => court.id !== String(courtId));
                                            console.log(`Корт ${courtId} удален из состояния тренировки`);

                                            // Обновляем количество кортов в состоянии
                                            trainingStateApi._localState.courtCount = remainingCourts;
                                            trainingStateApi._localState.lastUpdated = new Date().toISOString();

                                            // Обновляем локальное хранилище
                                            await updateLocalTrainingState();
                                            console.log(`Локальное состояние тренировки после удаления корта ${courtId} обновлено`);

                                            // Сохраняем обновленное состояние в базу данных
                                            await saveTrainingState();
                                            console.log(`Состояние тренировки после удаления корта ${courtId} сохранено в базу данных`);
                                        } catch (stateError) {
                                            console.error(`Ошибка при обновлении состояния тренировки после удаления корта ${courtId}:`, stateError);
                                        }

                                        // Если обновление прошло успешно, перезагружаем страницу деталей тренировки
                                        if (updatedTraining && updatedTraining.length > 0) {
                                            // Получаем полные данные тренировки
                                            const fullTraining = await trainingsApi.getTrainingById(parseInt(trainingId));
                                            if (fullTraining) {
                                                // Удаляем корт из DOM
                                                courtContainer.remove();

                                                // Перезагружаем детали тренировки
                                                openTrainingDetails(fullTraining);
                                                showMessage(`Корт ${courtId} успешно удален`, 'success');
                                                return; // Прерываем выполнение функции, так как страница будет перезагружена
                                            }
                                        }

                                        // Затем удаляем корт из DOM
                                        courtContainer.remove();

                                        // Обновляем локальное состояние
                                        if (typeof window.updateLocalTrainingState === 'function') {
                                            await window.updateLocalTrainingState();
                                        }

                                        // Сохраняем состояние в базу данных
                                        await saveTrainingState();

                                        // Показываем сообщение об успехе
                                        showMessage(`Корт ${courtId} успешно удален`, 'success');
                                    } catch (error) {
                                        console.error('Ошибка при удалении корта:', error);
                                        showMessage('Ошибка при удалении корта', 'error');
                                    }
                                }
                            });
                        }

                        // Добавляем обработчики для кнопок добавления игроков на новый корт

                        // 1. Обработчики для кнопок "Добавить из очереди"
                        const addFromQueueButtons = newCourtElement.querySelectorAll('.add-from-queue-btn');
                        addFromQueueButtons.forEach(button => {
                            button.addEventListener('click', (e) => {
                                e.stopPropagation();

                                const courtId = button.getAttribute('data-court');
                                const half = button.getAttribute('data-half');

                                // Проверяем, есть ли игроки в очереди
                                const queuePlayers = document.querySelectorAll('.queue-player-card:not(.removing)');
                                if (queuePlayers.length === 0) {
                                    showMessage('В очереди нет игроков', 'warning');
                                    return;
                                }

                                // Импортируем функцию динамически, чтобы избежать циклических зависимостей
                                import('./trainings-players.js').then(module => {
                                    // Добавляем первого игрока из очереди на корт
                                    module.addPlayerFromQueueToCourt(queuePlayers[0], courtId, half, () => {
                                        // Обновляем кнопку "Начать игру" для этого корта
                                        const courtContainer = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                                        if (courtContainer) {
                                            updateCourtVisibility(courtContainer);

                                            // Проверяем, все ли слоты заняты
                                            const slots = courtContainer.querySelectorAll('.court-player-slot');
                                            let occupiedSlots = 0;
                                            slots.forEach(slot => {
                                                if (slot.children.length > 0) {
                                                    occupiedSlots++;
                                                }
                                            });

                                            if (occupiedSlots === 4) {
                                                updateStartGameButton(courtContainer, (buttonElement, courtId) => {
                                                    startGameTimer(buttonElement, courtId,
                                                        // Обработчик отмены игры
                                                        async (buttonElement, timerInterval) => {
                                                            if (typeof window.updateLocalTrainingState === 'function') {
                                                                await window.updateLocalTrainingState();
                                                            }
                                                            await saveTrainingState();
                                                        },
                                                        // Обработчик завершения игры
                                                        (buttonElement, courtId, formattedTime, timerInterval) => {
                                                            // Получаем текущий режим тренировки
                                                            const trainingModeSelect = document.getElementById('training-mode');
                                                            const currentMode = trainingModeSelect ? trainingModeSelect.value : 'single';

                                                            // Получаем игроков на корте
                                                            const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                                                            if (!courtElement) {
                                                                console.error('Не найден элемент корта');
                                                                return;
                                                            }

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

                                                                // Показываем модальное окно выбора победителя
                                                                import('./trainings-ui.js').then(uiModule => {
                                                                    import('./trainings-state.js').then(stateModule => {
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
                                                        },
                                                        saveTrainingState
                                                    );
                                                });
                                            }
                                        }
                                    });
                                });
                            });
                        });

                        // 2. Обработчики для кнопок "+" (добавить выбранного игрока)
                        const addPlayerButtons = newCourtElement.querySelectorAll('.add-player-btn');
                        addPlayerButtons.forEach(button => {
                            button.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const courtId = button.getAttribute('data-court');
                                const half = button.getAttribute('data-half');

                                // Проверяем, есть ли игроки в очереди
                                const queuePlayers = document.querySelectorAll('.queue-player-card:not(.removing)');
                                if (queuePlayers.length === 0) {
                                    showMessage('В очереди нет игроков', 'warning');
                                    return;
                                }

                                // Импортируем функции динамически
                                import('./trainings-ui.js').then(uiModule => {
                                    import('./trainings-players.js').then(playersModule => {
                                        // Создаем модальное окно для выбора игрока
                                        uiModule.openPlayerSelectionModal(courtId, half, queuePlayers, (playerCard, courtId, half) => {
                                            playersModule.addPlayerFromQueueToCourt(playerCard, courtId, half, null, null);
                                        });
                                    });
                                });
                            });
                        });

                        // 3. Инициализируем видимость кнопок на всех половинах кортов
                        const courtHalves = newCourtElement.querySelectorAll('.court-half');
                        courtHalves.forEach(half => {
                            updateCourtHalfButtons(half);
                        });

                        // Обновляем локальное состояние
                        if (typeof window.updateLocalTrainingState === 'function') {
                            await window.updateLocalTrainingState();
                        }

                        // Сохраняем состояние в базу данных
                        await saveTrainingState();

                        // Показываем сообщение об успехе
                        showMessage(`Корт ${newCourtId} успешно добавлен`, 'success');
                    } catch (error) {
                        console.error('Ошибка при добавлении корта:', error);
                        showMessage('Ошибка при добавлении корта', 'error');
                    }
                });
            }

            // Обработчик для карточки добавления игрока удален, так как кнопка "+" больше не используется

            // Инициализируем иконки Feather
            if (window.feather) {
                feather.replace();
            }

            // Если есть сохраненное состояние, восстанавливаем его
            if (stateData && stateData.courts && stateData.courts.length > 0) {
                console.log('Восстанавливаем сохраненное состояние кортов');

                // Устанавливаем режим тренировки
                if (stateData.trainingMode) {
                    const trainingModeSelect = document.getElementById('training-mode');
                    if (trainingModeSelect) {
                        trainingModeSelect.value = stateData.trainingMode;
                    }
                }

                // Восстанавливаем состояние кортов
                stateData.courts.forEach(courtData => {
                    const courtElement = document.querySelector(`.court-container[data-court-id="${courtData.id}"]`);
                    if (!courtElement) {
                        console.error(`Не найден элемент корта с ID ${courtData.id}`);
                        return;
                    }

                    // Восстанавливаем название корта, если оно есть
                    if (courtData.name) {
                        const courtHeader = courtElement.querySelector('.court-header h4');
                        if (courtHeader) {
                            courtHeader.textContent = courtData.name;
                        }
                    }

                    // Восстанавливаем игроков на кортах всегда, независимо от состояния игры
                    console.log(`Восстанавливаем игроков на корте ${courtData.id}`);

                    // Восстанавливаем игроков на верхней половине корта
                    const topHalf = courtElement.querySelector('.court-half[data-half="top"]');
                    if (topHalf && courtData.topPlayers && courtData.topPlayers.length > 0) {
                        // Фильтруем null значения
                        const validTopPlayers = courtData.topPlayers.filter(player => player && player.id);

                        validTopPlayers.forEach(player => {
                            // Находим свободный слот
                            const emptySlot = Array.from(topHalf.querySelectorAll('.court-player-slot'))
                                .find(slot => slot.children.length === 0);

                            if (emptySlot && player && player.id) {
                                // Создаем элемент игрока
                                const playerElement = document.createElement('div');
                                playerElement.className = 'court-player';
                                playerElement.setAttribute('data-player-id', player.id);

                                // Получаем имя игрока
                                let playerName = player.name || '';
                                // Извлекаем только фамилию (предполагается, что фамилия идет первой в формате "Фамилия Имя")
                                const playerLastName = playerName.split(' ')[0] || 'Игрок';

                                // Получаем фото игрока или используем заглушку
                                const photoUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerLastName)}&background=3498db&color=fff&size=150`;

                                // Проверяем, есть ли у игрока значок "2-я игра"
                                const hasSecondGameBadge = player.hasSecondGameBadge === true;

                                playerElement.innerHTML = `
                                    <div class="court-player-photo-container">
                                        <img src="${photoUrl}" alt="${playerName}" class="court-player-photo">
                                        ${hasSecondGameBadge ? '<div class="second-game-badge">2</div>' : ''}
                                    </div>
                                    <div class="court-player-name">${playerLastName}</div>
                                    <button class="remove-player-btn" aria-label="Удалить игрока">
                                        <i data-feather="x"></i>
                                    </button>
                                `;

                                // Добавляем игрока в слот
                                emptySlot.appendChild(playerElement);

                                // Добавляем обработчик для кнопки удаления
                                const removeBtn = playerElement.querySelector('.remove-player-btn');
                                if (removeBtn) {
                                    removeBtn.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        removePlayerFromCourt(playerElement, player.id);
                                    });
                                }

                                // Загружаем полные данные игрока асинхронно
                                setTimeout(async () => {
                                    try {
                                        const playerData = await playersApi.getPlayer(player.id);
                                        if (playerData) {
                                            // Обновляем имя и фото
                                            const fullName = `${playerData.last_name || ''} ${playerData.first_name || ''}`.trim();
                                            const lastName = playerData.last_name || 'Игрок';
                                            const photoUrl = playerData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3498db&color=fff&size=150`;

                                            const photoElement = playerElement.querySelector('.court-player-photo');
                                            if (photoElement) {
                                                photoElement.src = photoUrl;
                                                photoElement.alt = fullName;
                                            }

                                            const nameElement = playerElement.querySelector('.court-player-name');
                                            if (nameElement) {
                                                nameElement.textContent = lastName;
                                            }
                                        }
                                    } catch (error) {
                                        console.error(`Ошибка при загрузке данных игрока с ID ${player.id}:`, error);
                                    }
                                }, 0);
                            }
                        });
                    }

                    // Восстанавливаем игроков на нижней половине корта
                    const bottomHalf = courtElement.querySelector('.court-half[data-half="bottom"]');
                    if (bottomHalf && courtData.bottomPlayers && courtData.bottomPlayers.length > 0) {
                        // Фильтруем null значения
                        const validBottomPlayers = courtData.bottomPlayers.filter(player => player && player.id);

                        validBottomPlayers.forEach(player => {
                            // Находим свободный слот
                            const emptySlot = Array.from(bottomHalf.querySelectorAll('.court-player-slot'))
                                .find(slot => slot.children.length === 0);

                            if (emptySlot && player && player.id) {
                                // Создаем элемент игрока
                                const playerElement = document.createElement('div');
                                playerElement.className = 'court-player';
                                playerElement.setAttribute('data-player-id', player.id);

                                // Получаем имя игрока
                                let playerName = player.name || '';
                                // Извлекаем только фамилию (предполагается, что фамилия идет первой в формате "Фамилия Имя")
                                const playerLastName = playerName.split(' ')[0] || 'Игрок';

                                // Получаем фото игрока или используем заглушку
                                const photoUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(playerLastName)}&background=3498db&color=fff&size=150`;

                                // Проверяем, есть ли у игрока значок "2-я игра"
                                const hasSecondGameBadge = player.hasSecondGameBadge === true;

                                playerElement.innerHTML = `
                                    <div class="court-player-photo-container">
                                        <img src="${photoUrl}" alt="${playerName}" class="court-player-photo">
                                        ${hasSecondGameBadge ? '<div class="second-game-badge">2</div>' : ''}
                                    </div>
                                    <div class="court-player-name">${playerLastName}</div>
                                    <button class="remove-player-btn" aria-label="Удалить игрока">
                                        <i data-feather="x"></i>
                                    </button>
                                `;

                                // Добавляем игрока в слот
                                emptySlot.appendChild(playerElement);

                                // Добавляем обработчик для кнопки удаления
                                const removeBtn = playerElement.querySelector('.remove-player-btn');
                                if (removeBtn) {
                                    removeBtn.addEventListener('click', (e) => {
                                        e.stopPropagation();
                                        removePlayerFromCourt(playerElement, player.id);
                                    });
                                }

                                // Загружаем полные данные игрока асинхронно
                                setTimeout(async () => {
                                    try {
                                        const playerData = await playersApi.getPlayer(player.id);
                                        if (playerData) {
                                            // Обновляем имя и фото
                                            const fullName = `${playerData.last_name || ''} ${playerData.first_name || ''}`.trim();
                                            const lastName = playerData.last_name || 'Игрок';
                                            const photoUrl = playerData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3498db&color=fff&size=150`;

                                            const photoElement = playerElement.querySelector('.court-player-photo');
                                            if (photoElement) {
                                                photoElement.src = photoUrl;
                                                photoElement.alt = fullName;
                                            }

                                            const nameElement = playerElement.querySelector('.court-player-name');
                                            if (nameElement) {
                                                nameElement.textContent = lastName;
                                            }
                                        }
                                    } catch (error) {
                                        console.error(`Ошибка при загрузке данных игрока с ID ${player.id}:`, error);
                                    }
                                }, 0);
                            }
                        });
                    }

                    // Обновляем видимость кнопок на половинах корта
                    const courtHalves = courtElement.querySelectorAll('.court-half');
                    courtHalves.forEach(half => {
                        updateCourtHalfButtons(half);
                    });

                    // Не вызываем updateStartGameButton здесь, так как это должно делаться только в initTrainingDetailsHandlers

                    // Если игра была в процессе, восстанавливаем состояние игры
                    if (courtData.gameInProgress && courtData.gameStartTime) {
                        // Находим кнопку "Начать игру"
                        const startGameBtn = courtElement.querySelector('.start-game-btn');
                        if (startGameBtn) {
                            // Запускаем таймер с сохраненным временем начала
                            startGameBtn.setAttribute('data-start-time', courtData.gameStartTime);
                            startGameTimer(startGameBtn, courtData.id);
                        }
                    }
                });

                // Инициализируем иконки Feather для новых элементов
                if (window.feather) {
                    feather.replace();
                }
            }

            // Инициализируем обработчики для деталей тренировки
            initTrainingDetailsHandlers(detailsContainer, saveTrainingState);
        }, 100); // Небольшая задержка для уверенности, что DOM обновился

        // Убедимся, что контейнер деталей тренировки имеет правильную ширину и высоту
        const trainingDetailsContainer = document.getElementById('training-details-container');
        if (trainingDetailsContainer) {
            trainingDetailsContainer.style.width = '100%';
            trainingDetailsContainer.style.maxWidth = '100%';
            trainingDetailsContainer.style.height = 'auto';
            trainingDetailsContainer.style.minHeight = '100vh';
            trainingDetailsContainer.style.overflowY = 'auto';
        }

        // Инициализируем иконки Feather
        console.log('Инициализация иконок Feather');
        if (window.feather) {
            console.log('Feather доступен, инициализируем иконки');
            feather.replace();
        } else {
            console.error('Feather не доступен');
        }

        // Скрываем экран загрузки и показываем контейнер с деталями после небольшой задержки
        setTimeout(() => {
            const loadingScreen = document.getElementById('training-details-loading');
            const detailsContainer = document.getElementById('training-details-container');

            if (loadingScreen) loadingScreen.style.display = 'none';
            if (detailsContainer) detailsContainer.style.display = 'block';

            console.log('Экран загрузки скрыт, контейнер с деталями показан');
        }, 500); // Задержка для плавного перехода
    }

    // Возвращаем публичные методы и свойства
    return {
        fetchTrainings: () => fetchTrainings(trainingsContainer)
    };
}