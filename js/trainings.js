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

        // Устанавливаем заголовок страницы
        titleElement.textContent = `${training.venue} - ${formattedDate}, ${training.time || 'Время не указано'}`;

        // Очищаем контейнер деталей
        detailsContainer.innerHTML = '';

        // Создаем содержимое страницы
        const content = document.createElement('div');
        content.className = 'training-details-content';

        // Получаем список игроков для тренировки
        let players = [];
        if (training.training_players && Array.isArray(training.training_players)) {
            players = training.training_players.map(tp => tp.players || tp);
        }

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

                // Возвращаем HTML для карточки игрока в очереди
                return `
                    <div class="queue-player-card" data-player-id="${player.id}">
                        <div class="queue-player-photo-container">
                            <img src="${photoUrl}" alt="${fullName}" class="queue-player-photo ${ratingClass}">
                        </div>
                        <div class="queue-player-info">
                            <div class="queue-player-name">${fullName}</div>
                            <div class="queue-player-rating">${rating}</div>
                        </div>
                        <div class="queue-player-actions">
                            <button class="queue-action-btn add-to-court-btn" data-player-id="${player.id}" aria-label="Добавить на корт">
                                <i data-feather="plus-circle"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Если игроков нет, показываем сообщение
        if (!playersQueueHTML) {
            playersQueueHTML = '<p class="no-players-message">Нет игроков в очереди</p>';
        }

        // Добавляем только очередь игроков
        content.innerHTML = `
            <div class="players-queue-section">
                <div class="section-header">
                    <h3>Очередь игроков</h3>
                </div>
                <div class="players-queue-container">
                    ${playersQueueHTML}
                </div>
            </div>
        `;

        // Добавляем содержимое в контейнер
        detailsContainer.appendChild(content);

        // Добавляем обработчики для кнопок в очереди игроков
        setTimeout(() => {
            const addToCourtButtons = detailsContainer.querySelectorAll('.add-to-court-btn');
            console.log('Найдено кнопок добавления на корт:', addToCourtButtons.length);

            addToCourtButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const playerId = button.getAttribute('data-player-id');
                    console.log('Нажата кнопка добавления игрока на корт:', playerId);
                    // В будущем здесь будет функционал добавления игрока на корт
                    showMessage('Функционал добавления игрока на корт будет реализован в следующем обновлении', 'info');
                });
            });
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
            console.log('Интерфейс деталей тренировки показан');
        } else {
            console.error('Не найден интерфейс деталей тренировки с ID "training-details-interface"');
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