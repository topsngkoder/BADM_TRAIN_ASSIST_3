// Модуль для работы с тренировками
import { trainingsApi, playersApi } from './api.js';
import { showMessage, openModal, closeModal } from './ui.js';

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

    // Инициализация обработчиков
    console.log('Инициализация обработчиков');
    initTrainingHandlers();

    // Загрузка тренировок
    console.log('Загрузка тренировок');
    fetchTrainings();

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
                }
            })
            .catch(error => {
                console.error('Ошибка при загрузке тренировки:', error);
                sessionStorage.removeItem('currentTrainingId');
            });
    }

    // Функция для инициализации обработчиков тренировок
    function initTrainingHandlers() {
        // Обработчик для кнопки "Добавить тренировку"
        addTrainingBtn.addEventListener('click', () => {
            openAddTrainingModal();
        });

        // Обработчик для формы добавления тренировки
        addTrainingForm.addEventListener('submit', handleAddTraining);

        // Инициализируем кнопку "Назад" на странице деталей тренировки
        const backBtn = document.getElementById('back-to-trainings-btn');
        console.log('Кнопка "Назад":', backBtn);
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                console.log('Нажата кнопка "Назад"');

                // Скрываем интерфейс деталей тренировки и показываем основной интерфейс
                console.log('Скрываем интерфейс деталей тренировки и показываем основной интерфейс');

                const trainingDetailsInterface = document.getElementById('training-details-interface');
                console.log('Интерфейс деталей тренировки:', trainingDetailsInterface);
                if (trainingDetailsInterface) {
                    trainingDetailsInterface.style.display = 'none';
                    console.log('Интерфейс деталей тренировки скрыт');
                } else {
                    console.error('Не найден интерфейс деталей тренировки с ID "training-details-interface"');
                }

                const mainInterface = document.getElementById('main-interface');
                console.log('Основной интерфейс:', mainInterface);
                if (mainInterface) {
                    mainInterface.style.display = 'block';
                    mainInterface.style.width = '100%';
                    mainInterface.style.maxWidth = '100%';
                    console.log('Основной интерфейс показан');
                } else {
                    console.error('Не найден основной интерфейс с ID "main-interface"');
                }

                // Очищаем ID текущей тренировки
                sessionStorage.removeItem('currentTrainingId');
                console.log('ID текущей тренировки очищен');
            });
        } else {
            console.error('Не найдена кнопка "Назад" с ID "back-to-trainings-btn"');
        }

        // Установка текущей даты в поле даты
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('trainingDate').value = formattedDate;

        // Установка текущего времени в поле времени (округленного до ближайшего часа)
        const hours = today.getHours();
        const formattedTime = `${hours.toString().padStart(2, '0')}:00`;
        document.getElementById('trainingTime').value = formattedTime;
    }

    // Функция для открытия модального окна добавления тренировки
    async function openAddTrainingModal() {
        try {
            // Загружаем список игроков для выбора
            const players = await playersApi.getPlayers('name');

            // Очищаем контейнер выбора игроков
            playersSelection.innerHTML = '';

            // Если игроков нет, показываем сообщение
            if (players.length === 0) {
                playersSelection.innerHTML = '<p class="text-center p-3">Нет доступных игроков. Сначала добавьте игроков.</p>';
            } else {
                // Создаем элементы для выбора игроков
                players.forEach(player => {
                    const playerItem = document.createElement('div');
                    playerItem.className = 'player-checkbox-item';

                    // Используем дефолтное изображение, если фото не указано
                    const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';

                    // Создаем элементы вручную для лучшего контроля
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'selectedPlayers';
                    checkbox.value = player.id;
                    checkbox.id = `player-${player.id}`;

                    const label = document.createElement('label');
                    label.className = 'player-checkbox-label';
                    label.htmlFor = `player-${player.id}`;

                    const img = document.createElement('img');
                    img.src = photoUrl;
                    img.alt = `${player.first_name} ${player.last_name}`;
                    img.className = 'player-checkbox-photo';

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

                    playersSelection.appendChild(playerItem);
                });
            }

            // Открываем модальное окно
            openModal(addTrainingModal);
        } catch (error) {
            console.error('Ошибка при загрузке игроков:', error);
            showMessage('Не удалось загрузить список игроков', 'error');
        }
    }

    // Функция для обработки добавления тренировки
    async function handleAddTraining(event) {
        event.preventDefault();

        // Получаем данные из формы
        const venue = document.getElementById('trainingVenue').value.trim();
        const date = document.getElementById('trainingDate').value;
        const time = document.getElementById('trainingTime').value;
        const courtCount = parseInt(document.getElementById('courtCount').value);

        // Получаем выбранных игроков
        const selectedPlayers = Array.from(
            document.querySelectorAll('input[name="selectedPlayers"]:checked')
        ).map(checkbox => checkbox.value);

        // Проверка данных
        if (!venue || !date || !time || isNaN(courtCount)) {
            showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        // Показываем индикатор загрузки
        const submitBtn = addTrainingForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Добавление...';
        submitBtn.disabled = true;

        try {
            // Добавляем тренировку
            await trainingsApi.addTraining({
                venue,
                date,
                time,
                courtCount,
                players: selectedPlayers
            });

            // Сбрасываем форму
            addTrainingForm.reset();

            // Устанавливаем текущую дату и время
            const today = new Date();
            document.getElementById('trainingDate').value = today.toISOString().split('T')[0];
            const hours = today.getHours();
            document.getElementById('trainingTime').value = `${hours.toString().padStart(2, '0')}:00`;

            // Закрываем модальное окно
            closeModal(addTrainingModal);

            // Обновляем список тренировок
            fetchTrainings();

            // Показываем сообщение об успехе
            showMessage('Тренировка успешно добавлена!', 'success');
        } catch (error) {
            console.error('Ошибка при добавлении тренировки:', error);
            showMessage('Произошла ошибка при добавлении тренировки', 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }

    // Функция для загрузки тренировок
    async function fetchTrainings() {
        console.log('Загрузка тренировок');
        try {
            // Получаем тренировки
            const trainings = await trainingsApi.getTrainings();
            console.log('Получены тренировки:', trainings);

            // Очистка контейнера
            console.log('Очистка контейнера тренировок');
            trainingsContainer.innerHTML = '';

            // Если тренировок нет, показываем сообщение
            if (trainings.length === 0) {
                console.log('Тренировок нет, показываем сообщение');
                trainingsContainer.innerHTML = '<p>У вас пока нет тренировок.</p>';
                return;
            }

            // Отображение каждой тренировки
            console.log('Отображение тренировок');
            trainings.forEach(training => {
                console.log('Создание карточки для тренировки:', training.id);
                const trainingCard = createTrainingCard(training);
                trainingsContainer.appendChild(trainingCard);
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
            trainingsContainer.innerHTML = '<p>Произошла ошибка при загрузке тренировок. Пожалуйста, попробуйте позже.</p>';
            showMessage('Ошибка при загрузке тренировок', 'error');
        }
    }

    // Функция для создания карточки тренировки
    function createTrainingCard(training) {
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
                // Открываем страницу с деталями тренировки
                openTrainingDetails(training);
            });

            // Добавляем обработчик для кнопки удаления
            const deleteBtn = card.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Предотвращаем всплытие события клика
                    handleDeleteTraining(training.id, card);
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

    // Функция для обработки удаления тренировки
    async function handleDeleteTraining(trainingId, cardElement) {
        // Запрашиваем подтверждение удаления
        if (!confirm('Вы уверены, что хотите удалить эту тренировку?')) {
            return;
        }

        try {
            // Добавляем класс для анимации удаления
            cardElement.classList.add('removing');

            // Удаляем тренировку через API
            await trainingsApi.deleteTraining(trainingId);

            // Ждем завершения анимации и удаляем элемент из DOM
            setTimeout(() => {
                cardElement.remove();

                // Проверяем, остались ли еще тренировки
                if (trainingsContainer.querySelectorAll('.training-card').length === 0) {
                    trainingsContainer.innerHTML = '<p>У вас пока нет тренировок.</p>';
                }

                // Показываем сообщение об успешном удалении
                showMessage('Тренировка успешно удалена', 'success');
            }, 300); // Время должно соответствовать длительности анимации в CSS
        } catch (error) {
            console.error('Ошибка при удалении тренировки:', error);

            // Убираем класс анимации
            cardElement.classList.remove('removing');

            // Показываем сообщение об ошибке
            showMessage('Не удалось удалить тренировку', 'error');
        }
    }

    // Функция для открытия страницы с деталями тренировки
    function openTrainingDetails(training) {
        console.log('Открытие деталей тренировки:', training);

        // Сохраняем ID тренировки в sessionStorage для возможности обновления данных
        sessionStorage.setItem('currentTrainingId', training.id);

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

        // Сортируем игроков по рейтингу (от высокого к низкому) для начального формирования очереди
        players.sort((a, b) => {
            const ratingA = parseInt(a.rating) || 0;
            const ratingB = parseInt(b.rating) || 0;
            return ratingB - ratingA; // Сортировка по убыванию
        });

        console.log('Отсортированные игроки по рейтингу для начальной очереди:', players);

        // Сохраняем отсортированную очередь в sessionStorage
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
            // Инициализируем видимость кнопок на всех половинах кортов
            const courtHalves = detailsContainer.querySelectorAll('.court-half');
            courtHalves.forEach(half => {
                updateCourtHalfButtons(half);
            });

            // Инициализируем кнопки "Начать игру" для всех кортов
            const courtContainers = detailsContainer.querySelectorAll('.court-container');
            courtContainers.forEach(court => {
                updateStartGameButton(court);
            });

            // Обработчики для карточек игроков в очереди
            const queuePlayerCards = detailsContainer.querySelectorAll('.queue-player-card');
            console.log('Найдено карточек игроков в очереди:', queuePlayerCards.length);

            // Удаляем обработчики для карточек игроков в очереди
            // queuePlayerCards.forEach(card => {
            //     card.addEventListener('click', (e) => {
            //         e.stopPropagation();
            //         const playerId = card.getAttribute('data-player-id');
            //         console.log('Нажата карточка игрока в очереди:', playerId);
            //         // В будущем здесь будет функционал добавления игрока на корт
            //         showMessage('Функционал добавления игрока на корт будет реализован в следующем обновлении', 'info');
            //     });
            // });

            // Флаг для отслеживания процесса добавления игрока
            let isAddingPlayer = false;

            // Обработчики для кнопок "Добавить из очереди"
            const addFromQueueButtons = detailsContainer.querySelectorAll('.add-from-queue-btn');
            console.log('Найдено кнопок добавления из очереди:', addFromQueueButtons.length);

            addFromQueueButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Если процесс добавления уже идет, игнорируем клик
                    if (isAddingPlayer) {
                        console.log('Процесс добавления игрока уже идет, игнорируем клик');
                        return;
                    }

                    const courtId = button.getAttribute('data-court');
                    const half = button.getAttribute('data-half');
                    console.log(`Нажата кнопка добавления из очереди на корт ${courtId}, половина ${half}`);

                    // Проверяем, есть ли игроки в очереди
                    const queuePlayers = detailsContainer.querySelectorAll('.queue-player-card:not(.removing)');
                    if (queuePlayers.length === 0) {
                        showMessage('В очереди нет игроков', 'warning');
                        return;
                    }

                    // Устанавливаем флаг, что процесс добавления начался
                    isAddingPlayer = true;

                    // Визуально блокируем кнопку
                    button.classList.add('disabled');

                    // Добавляем первого игрока из очереди на корт
                    addPlayerFromQueueToCourt(queuePlayers[0], courtId, half, () => {
                        // Callback после завершения анимации
                        isAddingPlayer = false;
                        button.classList.remove('disabled');
                    });
                });
            });

            // Функция для добавления игрока из очереди на корт
            function addPlayerFromQueueToCourt(playerCard, courtId, half, callback) {
                // Получаем ID игрока
                const playerId = playerCard.getAttribute('data-player-id');
                console.log(`Добавление игрока с ID ${playerId} на корт ${courtId}, половина ${half}`);

                // Находим половину корта
                const courtHalf = detailsContainer.querySelector(`.court-half[data-court="${courtId}"][data-half="${half}"]`);
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

                // Получаем данные игрока
                const playerFullName = playerCard.querySelector('.queue-player-name').textContent;
                const playerPhoto = playerCard.querySelector('.queue-player-photo').src;
                const playerRatingClass = Array.from(playerCard.querySelector('.queue-player-photo').classList)
                    .find(cls => cls.startsWith('rating-')) || 'rating-blue';

                // Извлекаем только фамилию (предполагается, что фамилия идет первой в формате "Фамилия Имя")
                const playerLastName = playerFullName.split(' ')[0];

                // Создаем элемент игрока на корте
                const playerElement = document.createElement('div');
                playerElement.className = 'court-player';
                playerElement.setAttribute('data-player-id', playerId);
                playerElement.innerHTML = `
                    <div class="court-player-photo-container">
                        <img src="${playerPhoto}" alt="${playerFullName}" class="court-player-photo">
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

                // Удаляем игрока из очереди
                playerCard.classList.add('removing');

                // Обновляем очередь в sessionStorage - удаляем игрока
                updateQueueInSessionStorage(playerId, playerFullName, 0, 'remove', null, playerPhoto);

                setTimeout(() => {
                    playerCard.remove();

                    // Проверяем, остались ли еще игроки в очереди
                    const remainingPlayers = detailsContainer.querySelectorAll('.queue-player-card');
                    if (remainingPlayers.length === 0) {
                        const queueContainer = detailsContainer.querySelector('.players-queue-container');
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
                        removePlayerFromCourt(playerElement, playerId, playerFullName, playerPhoto, playerRatingClass);
                    });
                }
            }

            // Функция для удаления игрока с корта
            function removePlayerFromCourt(playerElement, playerId, playerName, playerPhoto, ratingClass) {
                console.log(`Удаление игрока с ID ${playerId} с корта`);

                // Анимация удаления
                playerElement.classList.add('removing');

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

                    // Обновляем кнопку "Начать игру"
                    if (courtContainer) {
                        updateStartGameButton(courtContainer);
                    }

                    // Возвращаем игрока в очередь
                    const queueContainer = detailsContainer.querySelector('.players-queue-container');
                    if (queueContainer) {
                        // Проверяем, есть ли сообщение "Нет игроков в очереди"
                        const noPlayersMessage = queueContainer.querySelector('.no-players-message');
                        if (noPlayersMessage) {
                            noPlayersMessage.remove();
                        }

                        // Создаем карточку игрока для очереди
                        const playerCard = document.createElement('div');
                        playerCard.className = 'queue-player-card';
                        playerCard.setAttribute('data-player-id', playerId);

                        // Получаем рейтинг игрока из очереди в sessionStorage
                        let playerRating = 0;
                        const queueJson = sessionStorage.getItem('playersQueue');
                        if (queueJson) {
                            try {
                                const queue = JSON.parse(queueJson);
                                const player = queue.find(p => p.id === playerId);
                                if (player) {
                                    playerRating = parseInt(player.rating) || 0;
                                }
                            } catch (e) {
                                console.error('Ошибка при получении рейтинга игрока:', e);
                            }
                        }

                        // Определяем класс рейтинга
                        let ratingClass = 'rating-blue';
                        if (playerRating >= 800) {
                            ratingClass = 'rating-red';
                        } else if (playerRating >= 600) {
                            ratingClass = 'rating-orange';
                        } else if (playerRating >= 450) {
                            ratingClass = 'rating-yellow';
                        } else if (playerRating >= 300) {
                            ratingClass = 'rating-green';
                        }

                        // Используем API для генерации аватаров, если фото не передано или недоступно
                        const photoUrl = playerPhoto && !playerPhoto.includes('ui-avatars.com') ?
                            playerPhoto :
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=3498db&color=fff&size=150`;

                        playerCard.innerHTML = `
                            <div class="queue-player-photo-container">
                                <img src="${photoUrl}" alt="${playerName}" class="queue-player-photo ${ratingClass}">
                            </div>
                            <div class="queue-player-info">
                                <div class="queue-player-name">${playerName}</div>
                                <div class="queue-player-rating">Рейтинг: ${playerRating > 0 ? playerRating : 'Нет'}</div>
                            </div>
                        `;

                        // Обновляем очередь в sessionStorage
                        // При удалении игрока с корта он всегда идет в начало очереди, рейтинг не влияет на порядок
                        updateQueueInSessionStorage(playerId, playerName, playerRating, 'add', 'start', playerPhoto);

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
            }

            // Обработчики для кнопок "+" (добавить выбранного игрока)
            const addPlayerButtons = detailsContainer.querySelectorAll('.add-player-btn');
            console.log('Найдено кнопок добавления выбранного игрока:', addPlayerButtons.length);

            addPlayerButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const courtId = button.getAttribute('data-court');
                    const half = button.getAttribute('data-half');
                    console.log(`Нажата кнопка добавления выбранного игрока на корт ${courtId}, половина ${half}`);

                    // Проверяем, есть ли игроки в очереди
                    const queuePlayers = detailsContainer.querySelectorAll('.queue-player-card:not(.removing)');
                    if (queuePlayers.length === 0) {
                        showMessage('В очереди нет игроков', 'warning');
                        return;
                    }

                    // Создаем модальное окно для выбора игрока
                    openPlayerSelectionModal(courtId, half, queuePlayers);
                });
            });

            // Функция для обновления видимости кнопок на половине корта
            function updateCourtHalfButtons(courtHalf) {
                if (!courtHalf) return;

                // Получаем все слоты для игроков на этой половине корта
                const slots = courtHalf.querySelectorAll('.court-player-slot');

                // Считаем количество занятых слотов
                let occupiedSlots = 0;
                slots.forEach(slot => {
                    if (slot.children.length > 0) {
                        occupiedSlots++;
                    }
                });

                // Получаем кнопки на этой половине корта
                const addFromQueueBtn = courtHalf.querySelector('.add-from-queue-btn');
                const addPlayerBtn = courtHalf.querySelector('.add-player-btn');

                // Если все слоты заняты (обычно их 2), скрываем кнопки
                if (occupiedSlots >= slots.length) {
                    if (addFromQueueBtn) addFromQueueBtn.style.display = 'none';
                    if (addPlayerBtn) addPlayerBtn.style.display = 'none';
                } else {
                    // Иначе показываем кнопки
                    if (addFromQueueBtn) addFromQueueBtn.style.display = '';
                    if (addPlayerBtn) addPlayerBtn.style.display = '';
                }

                // Проверяем, полностью ли заполнен корт (все 4 игрока)
                const courtContainer = courtHalf.closest('.court-container');
                if (courtContainer) {
                    updateStartGameButton(courtContainer);
                }
            }

            // Функция для проверки заполненности корта и отображения кнопки "Начать игру"
            function updateStartGameButton(courtContainer) {
                // Получаем ID корта
                const courtId = courtContainer.getAttribute('data-court-id');

                // Получаем все слоты для игроков на этом корте
                const slots = courtContainer.querySelectorAll('.court-player-slot');

                // Считаем количество занятых слотов
                let occupiedSlots = 0;
                slots.forEach(slot => {
                    if (slot.children.length > 0) {
                        occupiedSlots++;
                    }
                });

                // Проверяем, есть ли уже кнопка "Начать игру"
                let startGameBtn = courtContainer.querySelector('.start-game-btn');

                // Если все 4 слота заняты, показываем кнопку "Начать игру"
                if (occupiedSlots === 4) {
                    // Если кнопки еще нет, создаем ее
                    if (!startGameBtn) {
                        startGameBtn = document.createElement('button');
                        startGameBtn.className = 'start-game-btn';
                        startGameBtn.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                        startGameBtn.setAttribute('data-court-id', courtId);

                        // Добавляем обработчик для кнопки
                        startGameBtn.addEventListener('click', () => {
                            console.log(`Нажата кнопка "Начать игру" для корта ${courtId}`);
                            // Запускаем игру и превращаем кнопку в таймер
                            startGameTimer(startGameBtn, courtId);
                        });

                        // Добавляем кнопку в конец контейнера корта
                        courtContainer.appendChild(startGameBtn);

                        // Инициализируем иконки Feather
                        if (window.feather) {
                            feather.replace();
                        }
                    } else {
                        // Если кнопка уже есть, показываем ее
                        startGameBtn.style.display = '';
                    }
                } else {
                    // Если не все слоты заняты, скрываем кнопку
                    if (startGameBtn) {
                        startGameBtn.style.display = 'none';
                    }
                }
            }

            // Функция для запуска таймера игры
            function startGameTimer(buttonElement, courtId) {
                // Проверяем, не запущен ли уже таймер
                if (buttonElement.classList.contains('timer-active')) {
                    console.log('Таймер уже запущен');
                    return;
                }

                // Добавляем класс для анимации
                buttonElement.classList.add('timer-transition');

                // Получаем ID корта и элемент корта
                const courtIdForLock = buttonElement.getAttribute('data-court-id');
                const courtElementForLock = document.querySelector(`.court-container[data-court-id="${courtIdForLock}"]`);
                if (courtElementForLock) {
                    // Блокируем возможность изменения состава игроков
                    lockCourtPlayers(courtElementForLock);
                }

                // Создаем контейнер для таймера и кнопок
                const gameControlsContainer = document.createElement('div');
                gameControlsContainer.className = 'game-controls-container';

                // Создаем кнопку "Отмена"
                const cancelButton = document.createElement('button');
                cancelButton.className = 'game-control-btn cancel-btn';
                cancelButton.innerHTML = '<i data-feather="x"></i> Отмена';
                cancelButton.title = 'Отменить игру';

                // Создаем таймер
                const timerElement = document.createElement('div');
                timerElement.className = 'game-timer';
                timerElement.innerHTML = '<i data-feather="clock"></i> 00:00';

                // Создаем кнопку "Игра завершена"
                const finishButton = document.createElement('button');
                finishButton.className = 'game-control-btn finish-btn';
                finishButton.innerHTML = '<i data-feather="check"></i> Игра завершена';
                finishButton.title = 'Завершить игру';

                // Добавляем элементы в контейнер
                gameControlsContainer.appendChild(cancelButton);
                gameControlsContainer.appendChild(timerElement);
                gameControlsContainer.appendChild(finishButton);

                // Заменяем содержимое кнопки на контейнер с элементами управления
                buttonElement.innerHTML = '';
                buttonElement.appendChild(gameControlsContainer);
                buttonElement.classList.add('timer-active');

                // Инициализируем иконки Feather
                if (window.feather) {
                    feather.replace();
                }

                // Добавляем обработчики для кнопок
                cancelButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Нажата кнопка "Отмена" для корта', courtId);
                    cancelGame(buttonElement, timerInterval);
                });

                finishButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('Нажата кнопка "Игра завершена" для корта', courtId);
                    finishGame(buttonElement, timerInterval);
                });

                // Сохраняем время начала игры
                const startTime = new Date();
                buttonElement.setAttribute('data-start-time', startTime.getTime());

                // Запускаем таймер
                const timerInterval = setInterval(() => {
                    // Получаем текущее время
                    const currentTime = new Date();

                    // Вычисляем разницу в миллисекундах
                    const elapsedTime = currentTime - startTime;

                    // Преобразуем в минуты и секунды
                    const minutes = Math.floor(elapsedTime / 60000);
                    const seconds = Math.floor((elapsedTime % 60000) / 1000);

                    // Форматируем время
                    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                    // Обновляем текст таймера
                    const timerElement = buttonElement.querySelector('.game-timer');
                    if (timerElement) {
                        timerElement.innerHTML = `<i data-feather="clock"></i> ${formattedTime}`;

                        // Обновляем иконки Feather
                        if (window.feather) {
                            feather.replace();
                        }
                    }
                }, 1000);

                // Сохраняем ID интервала в атрибуте кнопки для возможности остановки таймера в будущем
                buttonElement.setAttribute('data-timer-id', timerInterval);

                // Функция для блокировки изменения состава игроков на корте
                function lockCourtPlayers(courtElement) {
                    // Скрываем кнопки добавления игроков
                    const addButtons = courtElement.querySelectorAll('.add-from-queue-btn, .add-player-btn');
                    addButtons.forEach(button => {
                        button.style.display = 'none';
                    });

                    // Скрываем кнопки удаления игроков
                    const removeButtons = courtElement.querySelectorAll('.remove-player-btn');
                    removeButtons.forEach(button => {
                        button.style.display = 'none';
                    });

                    // Добавляем класс к корту, указывающий, что игра идет
                    courtElement.classList.add('game-in-progress');
                }

                // Функция для разблокировки изменения состава игроков на корте
                function unlockCourtPlayers(courtElement) {
                    // Удаляем класс, указывающий, что игра идет
                    courtElement.classList.remove('game-in-progress');

                    // Обновляем видимость кнопок на всех половинах корта
                    const courtHalves = courtElement.querySelectorAll('.court-half');
                    courtHalves.forEach(half => {
                        updateCourtHalfButtons(half);
                    });

                    // Показываем кнопки удаления игроков
                    const removeButtons = courtElement.querySelectorAll('.remove-player-btn');
                    removeButtons.forEach(button => {
                        button.style.display = '';
                    });
                }

                // Функция для отмены игры
                function cancelGame(buttonElement, timerInterval) {
                    // Останавливаем таймер
                    clearInterval(timerInterval);

                    // Возвращаем кнопку в исходное состояние
                    buttonElement.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                    buttonElement.classList.remove('timer-active');
                    buttonElement.classList.remove('timer-transition');
                    buttonElement.style.pointerEvents = '';
                    buttonElement.title = '';

                    // Инициализируем иконки Feather
                    if (window.feather) {
                        feather.replace();
                    }

                    // Получаем ID корта
                    const courtId = buttonElement.getAttribute('data-court-id');

                    // Получаем элемент корта
                    const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                    if (courtElement) {
                        // Разблокируем изменение состава игроков
                        unlockCourtPlayers(courtElement);
                    }
                }

                // Функция для завершения игры
                function finishGame(buttonElement, timerInterval) {
                    // Останавливаем таймер
                    clearInterval(timerInterval);

                    // Получаем время игры
                    const startTimeMs = parseInt(buttonElement.getAttribute('data-start-time'));
                    const endTimeMs = new Date().getTime();
                    const gameDurationMs = endTimeMs - startTimeMs;

                    // Преобразуем в минуты и секунды
                    const minutes = Math.floor(gameDurationMs / 60000);
                    const seconds = Math.floor((gameDurationMs % 60000) / 1000);

                    // Форматируем время
                    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                    // Получаем ID корта
                    const courtId = buttonElement.getAttribute('data-court-id');

                    // Получаем текущий режим тренировки
                    const trainingModeSelect = document.getElementById('training-mode');
                    const currentMode = trainingModeSelect ? trainingModeSelect.value : 'single';

                    // Обрабатываем завершение игры в зависимости от режима
                    if (currentMode === 'single') {
                        // Режим "Играем один раз"
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
                            showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, formattedTime);
                        } else {
                            // Если на корте не 4 игрока, просто показываем сообщение о завершении
                            showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                            resetGameButton();
                        }
                    } else {
                        // Другие режимы (пока просто показываем сообщение)
                        showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                        resetGameButton();
                    }

                    // Функция для сброса кнопки в исходное состояние
                    function resetGameButton() {
                        buttonElement.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                        buttonElement.classList.remove('timer-active');
                        buttonElement.classList.remove('timer-transition');
                        buttonElement.style.pointerEvents = '';
                        buttonElement.title = '';

                        // Инициализируем иконки Feather
                        if (window.feather) {
                            feather.replace();
                        }

                        // Получаем элемент корта
                        const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                        if (courtElement) {
                            // Разблокируем изменение состава игроков
                            unlockCourtPlayers(courtElement);
                        }
                    }
                }
            }

            // Функция для отображения модального окна выбора победителя
            function showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, gameDuration) {
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
                        handleWinnerSelection(courtId, 'top', topPlayers, bottomPlayers);
                    }, 300);
                });

                bottomTeamBtn.addEventListener('click', () => {
                    // Сначала закрываем модальное окно
                    modal.classList.remove('active');
                    setTimeout(() => {
                        modal.remove();
                        // Затем обрабатываем выбор нижней команды как победителя
                        handleWinnerSelection(courtId, 'bottom', topPlayers, bottomPlayers);
                    }, 300);
                });
            }

            // Функция для обработки выбора победителя
            function handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers) {
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

                // Удаляем игроков с корта
                const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                if (!courtElement) {
                    console.error('Не найден элемент корта');
                    return;
                }

                // Удаляем всех игроков с корта
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

                // Получаем рейтинги игроков из очереди в sessionStorage
                const getPlayerRating = (playerId) => {
                    let rating = 0;
                    const queueJson = sessionStorage.getItem('playersQueue');
                    if (queueJson) {
                        try {
                            const queue = JSON.parse(queueJson);
                            const player = queue.find(p => p.id === playerId);
                            if (player) {
                                rating = parseInt(player.rating) || 0;
                            }
                        } catch (e) {
                            console.error('Ошибка при получении рейтинга игрока:', e);
                        }
                    }
                    return rating;
                };

                // В режиме "Играем один раз" победители идут в конец очереди, а проигравшие - после них
                // Рейтинг здесь не учитывается для сортировки, а только для отображения
                setTimeout(() => {
                    // Добавляем победителей в конец очереди
                    winners.forEach(player => {
                        const rating = getPlayerRating(player.id);
                        addPlayerToQueue(player.id, player.name, rating, 'end', player.photo);
                    });

                    // Добавляем проигравших в конец очереди после победителей
                    setTimeout(() => {
                        losers.forEach(player => {
                            const rating = getPlayerRating(player.id);
                            addPlayerToQueue(player.id, player.name, rating, 'end', player.photo);
                        });
                    }, 300);
                }, 300);

                // Сбрасываем кнопку "Начать игру"
                const startGameBtn = courtElement.querySelector('.start-game-btn');
                if (startGameBtn) {
                    startGameBtn.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                    startGameBtn.classList.remove('timer-active');
                    startGameBtn.classList.remove('timer-transition');
                    startGameBtn.style.pointerEvents = '';
                    startGameBtn.title = '';

                    // Инициализируем иконки Feather
                    if (window.feather) {
                        feather.replace();
                    }
                }
            }

            // Функция для добавления игрока в очередь
            function addPlayerToQueue(playerId, playerName, rating = 0, position = 'end', playerPhoto = null) {
                console.log(`Добавление игрока ${playerName} (ID: ${playerId}, рейтинг: ${rating}) в очередь`);

                // Получаем данные игрока
                const player = {
                    id: playerId,
                    name: playerName,
                    rating: rating,
                    photo: playerPhoto
                };

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

                // Создаем элемент игрока в очереди
                const playerElement = document.createElement('div');
                playerElement.className = 'queue-player-card';
                playerElement.setAttribute('data-player-id', player.id);
                playerElement.setAttribute('data-player-rating', player.rating);

                // Используем переданное фото или генерируем аватар
                const photoUrl = player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3498db&color=fff&size=150`;

                // Определяем класс рейтинга
                let ratingClass = 'rating-blue';
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
                        <img src="${photoUrl}" alt="${player.name}" class="queue-player-photo ${ratingClass}">
                    </div>
                    <div class="queue-player-info">
                        <div class="queue-player-name">${player.name}</div>
                        <div class="queue-player-rating">Рейтинг: ${rating > 0 ? rating : 'Нет'}</div>
                    </div>
                `;

                // Добавляем игрока в очередь в зависимости от позиции
                if (position === 'end') {
                    // Добавляем в конец очереди
                    queueContainer.appendChild(playerElement);

                    // Обновляем очередь в sessionStorage
                    updateQueueInSessionStorage(playerId, playerName, rating, 'add', 'end');
                } else {
                    // Добавляем в начало очереди
                    queueContainer.prepend(playerElement);

                    // Обновляем очередь в sessionStorage
                    updateQueueInSessionStorage(playerId, playerName, rating, 'add', 'start');
                }

                // Добавляем класс для анимации
                playerElement.classList.add('added');

                // Добавляем обработчик для перетаскивания игрока на корт
                playerElement.addEventListener('click', function() {
                    console.log(`Нажат игрок в очереди: ${player.name} (ID: ${player.id}, рейтинг: ${player.rating})`);
                });

                return playerElement;
            }

            // Функция для обновления очереди в sessionStorage
            function updateQueueInSessionStorage(playerId, playerName, rating, action, position, photo = null) {
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
                    // Создаем объект игрока
                    const player = {
                        id: playerId,
                        first_name: playerName.split(' ')[1] || '',
                        last_name: playerName.split(' ')[0] || playerName,
                        rating: rating,
                        photo: photo
                    };

                    // Проверяем, есть ли уже игрок с таким ID в очереди
                    const existingPlayerIndex = queue.findIndex(p => p.id === playerId);

                    if (existingPlayerIndex !== -1) {
                        // Если игрок уже есть в очереди, удаляем его
                        queue.splice(existingPlayerIndex, 1);
                    }

                    // Добавляем игрока в очередь в зависимости от позиции
                    // Позиция определяется правилами игры, а не рейтингом
                    if (position === 'end') {
                        // Добавляем в конец очереди (победители, затем проигравшие)
                        queue.push(player);
                    } else {
                        // Добавляем в начало очереди (при удалении игрока с корта)
                        queue.unshift(player);
                    }
                } else if (action === 'remove') {
                    // Удаляем игрока из очереди
                    queue = queue.filter(p => p.id !== playerId);
                }

                // Сохраняем обновленную очередь в sessionStorage
                sessionStorage.setItem('playersQueue', JSON.stringify(queue));
                console.log('Очередь обновлена в sessionStorage:', queue);
            }

            // Функция для открытия модального окна выбора игрока
            function openPlayerSelectionModal(courtId, half, queuePlayers) {
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
                        const playerCard = detailsContainer.querySelector(`.queue-player-card[data-player-id="${playerId}"]`);
                        if (playerCard) {
                            // Добавляем игрока на корт
                            addPlayerFromQueueToCourt(playerCard, courtId, half);

                            // Закрываем модальное окно
                            closeModal(playerSelectionModal);
                        } else {
                            console.error(`Не найдена карточка игрока с ID ${playerId}`);
                        }
                    });
                });
            }

            // Инициализируем иконки Feather
            if (window.feather) {
                feather.replace();
            }
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

    // Функция для склонения слова "корт"
    function getCourtWord(count) {
        if (count === 1) {
            return 'корт';
        } else if (count >= 2 && count <= 4) {
            return 'корта';
        } else {
            return 'кортов';
        }
    }

    // Возвращаем публичные методы и свойства
    return {
        fetchTrainings
    };
}