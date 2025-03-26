// Основной модуль для работы с тренировками
import { trainingsApi } from './api.js';
import { showMessage } from './ui.js';
import { createTrainingCard, getCourtWord } from './trainings-ui.js';
import { initTrainingHandlers, handleDeleteTraining, initTrainingDetailsHandlers } from './trainings-handlers.js';
import { loadTrainingState, saveTrainingState } from './trainings-state.js';
import { updateCourtHalfButtons, updateStartGameButton, startGameTimer, unlockCourtPlayers } from './trainings-court.js';
import { removePlayerFromCourt } from './trainings-players.js';

// Инициализация модуля тренировок
export function initTrainingsModule() {
    console.log('Инициализация модуля тренировок');

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

    // Проверяем, есть ли сохраненный ID тренировки (если пользователь обновил страницу)
    const savedTrainingId = sessionStorage.getItem('currentTrainingId');
    console.log('Сохраненный ID тренировки:', savedTrainingId);

    if (savedTrainingId) {
        console.log('Загрузка тренировки по ID:', savedTrainingId);
        // Загружаем данные тренировки и открываем страницу деталей
        trainingsApi.getTrainingById(parseInt(savedTrainingId))
            .then(training => {
                console.log('Получена тренировка по ID:', training);
                if (training) {
                    console.log('Открытие страницы деталей тренировки');
                    openTrainingDetails(training);
                } else {
                    console.log('Тренировка не найдена, очищаем ID');
                    // Если тренировка не найдена, очищаем ID
                    sessionStorage.removeItem('currentTrainingId');
                    showMessage('Тренировка не найдена в базе данных', 'error');
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке тренировки:', error);
                sessionStorage.removeItem('currentTrainingId');
                showMessage('Ошибка при загрузке тренировки из базы данных', 'error');
            });
    }

    // Функция для открытия страницы с деталями тренировки
    async function openTrainingDetails(training) {
        console.log('Открытие деталей тренировки:', training);

        // Сохраняем ID тренировки в sessionStorage для возможности обновления данных
        sessionStorage.setItem('currentTrainingId', training.id);

        try {
            // Загружаем состояние тренировки
            await loadTrainingState(training.id);
        } catch (error) {
            console.error('Ошибка при загрузке состояния тренировки:', error);
            showMessage('Не удалось загрузить тренировку из базы данных', 'error');

            // Возвращаемся на главную страницу
            const backBtn = document.getElementById('back-to-trainings-btn');
            if (backBtn) {
                backBtn.click();
            } else {
                // Если кнопка "Назад" не найдена, перезагружаем страницу
                window.location.reload();
            }
            return; // Прерываем выполнение функции
        }

        // Получаем элементы страницы
        const titleElement = document.getElementById('training-title');
        const detailsContainer = document.getElementById('training-details-container');

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
                <option value="single">Играем один раз</option>
                <option value="max-two-wins">Не больше двух побед</option>
                <option value="winner-stays">Победитель остается всегда</option>
            </select>
        `;

        // Добавляем обработчик изменения режима тренировки
        const trainingModeSelect = trainingModeElement.querySelector('#training-mode');
        if (trainingModeSelect) {
            trainingModeSelect.addEventListener('change', (e) => {
                const selectedMode = e.target.value;
                console.log('Выбран режим тренировки:', selectedMode);
                // Здесь будет функционал для разных режимов тренировки
            });
        }

        // Очищаем контейнер деталей
        detailsContainer.innerHTML = '';

        // Создаем содержимое страницы
        const content = document.createElement('div');
        content.className = 'training-details-content';

        // Получаем список игроков для тренировки
        let players = [];
        if (training.training_players && Array.isArray(training.training_players)) {
            players = training.training_players
                .filter(tp => tp && tp.players) // Фильтруем только записи с игроками
                .map(tp => tp.players);
        }

        // Проверяем, есть ли сохраненное состояние тренировки
        const savedStateJson = sessionStorage.getItem('trainingState');
        let savedState = null;

        if (savedStateJson) {
            try {
                savedState = JSON.parse(savedStateJson);
                console.log('Найдено сохраненное состояние тренировки:', savedState);

                // Если есть сохраненная очередь игроков, используем ее
                if (savedState.playersQueue && savedState.playersQueue.length > 0) {
                    console.log('Используем сохраненную очередь игроков');
                    players = savedState.playersQueue;
                } else {
                    // Иначе сортируем игроков по рейтингу
                    players.sort((a, b) => {
                        const ratingA = parseInt(a.rating) || 0;
                        const ratingB = parseInt(b.rating) || 0;
                        return ratingB - ratingA; // Сортировка по убыванию
                    });
                    console.log('Отсортированные игроки по рейтингу для начальной очереди:', players);
                }
            } catch (e) {
                console.error('Ошибка при парсинге сохраненного состояния:', e);

                // В случае ошибки сортируем игроков по рейтингу
                players.sort((a, b) => {
                    const ratingA = parseInt(a.rating) || 0;
                    const ratingB = parseInt(b.rating) || 0;
                    return ratingB - ratingA; // Сортировка по убыванию
                });
                console.log('Отсортированные игроки по рейтингу для начальной очереди:', players);
            }
        } else {
            // Если нет сохраненного состояния, сортируем игроков по рейтингу
            players.sort((a, b) => {
                const ratingA = parseInt(a.rating) || 0;
                const ratingB = parseInt(b.rating) || 0;
                return ratingB - ratingA; // Сортировка по убыванию
            });
            console.log('Отсортированные игроки по рейтингу для начальной очереди:', players);
        }

        // Сохраняем очередь в sessionStorage
        sessionStorage.setItem('playersQueue', JSON.stringify(players));

        // Создаем HTML для игроков в очереди
        let playersQueueHTML = '';
        if (players.length > 0) {
            playersQueueHTML = players.map(player => {
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
                    <div class="players-queue-container horizontal">
                        ${playersQueueHTML}
                    </div>
                </div>
                <div class="courts-section" style="width: 100%; height: auto; min-height: 500px; display: flex; flex-direction: column;">
                    <div class="courts-container" style="display: flex; flex-direction: column; width: 100%; overflow-y: auto; max-height: none; padding-bottom: 50px;">
                        ${courtsHTML}
                    </div>
                </div>
            </div>
        `;

        // Добавляем содержимое в контейнер
        detailsContainer.appendChild(content);

        // Добавляем обработчики для кнопок и карточек игроков
        setTimeout(() => {
            // Если есть сохраненное состояние, восстанавливаем его
            if (savedState && savedState.courts && savedState.courts.length > 0) {
                console.log('Восстанавливаем сохраненное состояние кортов');

                // Устанавливаем режим тренировки
                if (savedState.trainingMode) {
                    const trainingModeSelect = document.getElementById('training-mode');
                    if (trainingModeSelect) {
                        trainingModeSelect.value = savedState.trainingMode;
                    }
                }

                // Восстанавливаем состояние кортов
                savedState.courts.forEach(courtData => {
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

                    // Восстанавливаем игроков на кортах только если игра в процессе
                    if (courtData.gameInProgress && courtData.gameStartTime) {
                        console.log(`Восстанавливаем игроков на корте ${courtData.id}, игра в процессе`);

                        // Восстанавливаем игроков на верхней половине корта
                        const topHalf = courtElement.querySelector('.court-half[data-half="top"]');
                        if (topHalf && courtData.topPlayers && courtData.topPlayers.length > 0) {
                            courtData.topPlayers.forEach(player => {
                                // Находим свободный слот
                                const emptySlot = Array.from(topHalf.querySelectorAll('.court-player-slot'))
                                    .find(slot => slot.children.length === 0);

                                if (emptySlot) {
                                    // Создаем элемент игрока
                                    const playerElement = document.createElement('div');
                                    playerElement.className = 'court-player';
                                    playerElement.setAttribute('data-player-id', player.id);

                                    // Извлекаем только фамилию (предполагается, что фамилия идет первой в формате "Фамилия Имя")
                                    const playerLastName = player.name.split(' ')[0];

                                    playerElement.innerHTML = `
                                        <div class="court-player-photo-container">
                                            <img src="${player.photo}" alt="${player.name}" class="court-player-photo">
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
                                }
                            });
                        }

                        // Восстанавливаем игроков на нижней половине корта
                        const bottomHalf = courtElement.querySelector('.court-half[data-half="bottom"]');
                        if (bottomHalf && courtData.bottomPlayers && courtData.bottomPlayers.length > 0) {
                            courtData.bottomPlayers.forEach(player => {
                                // Находим свободный слот
                                const emptySlot = Array.from(bottomHalf.querySelectorAll('.court-player-slot'))
                                    .find(slot => slot.children.length === 0);

                                if (emptySlot) {
                                    // Создаем элемент игрока
                                    const playerElement = document.createElement('div');
                                    playerElement.className = 'court-player';
                                    playerElement.setAttribute('data-player-id', player.id);

                                    // Извлекаем только фамилию (предполагается, что фамилия идет первой в формате "Фамилия Имя")
                                    const playerLastName = player.name.split(' ')[0];

                                    playerElement.innerHTML = `
                                        <div class="court-player-photo-container">
                                            <img src="${player.photo}" alt="${player.name}" class="court-player-photo">
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
                                }
                            });
                        }
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
            trainingDetailsInterface.style.display = 'block';
            trainingDetailsInterface.style.width = '100%';
            trainingDetailsInterface.style.maxWidth = '100%';
            console.log('Интерфейс деталей тренировки показан');
        } else {
            console.error('Не найден интерфейс деталей тренировки с ID "training-details-interface"');
        }

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
    }

    // Возвращаем публичные методы и свойства
    return {
        fetchTrainings: () => fetchTrainings(trainingsContainer)
    };
}