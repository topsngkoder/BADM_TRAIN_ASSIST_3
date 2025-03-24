// Модуль для работы с тренировками
import { trainingsApi, playersApi } from './api.js';
import { showMessage, openModal, closeModal } from './ui.js';

// Инициализация модуля тренировок
export function initTrainingsModule() {
    // DOM элементы
    const addTrainingBtn = document.getElementById('add-training-btn');
    const addTrainingModal = document.getElementById('add-training-modal');
    const addTrainingForm = document.getElementById('add-training-form');
    const trainingsContainer = document.getElementById('trainings-container');
    const playersSelection = document.getElementById('players-selection');

    // Инициализация обработчиков
    initTrainingHandlers();

    // Загрузка тренировок
    fetchTrainings();

    // Функция для инициализации обработчиков тренировок
    function initTrainingHandlers() {
        // Обработчик для кнопки "Добавить тренировку"
        addTrainingBtn.addEventListener('click', () => {
            openAddTrainingModal();
        });

        // Обработчик для формы добавления тренировки
        addTrainingForm.addEventListener('submit', handleAddTraining);

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
        try {
            // Получаем тренировки
            const trainings = await trainingsApi.getTrainings();

            // Очистка контейнера
            trainingsContainer.innerHTML = '';

            // Если тренировок нет, показываем сообщение
            if (trainings.length === 0) {
                trainingsContainer.innerHTML = '<p>У вас пока нет тренировок.</p>';
                return;
            }

            // Отображение каждой тренировки
            trainings.forEach(training => {
                const trainingCard = createTrainingCard(training);
                trainingsContainer.appendChild(trainingCard);
            });

            // Инициализируем иконки Feather после добавления всех карточек в DOM
            if (window.feather) {
                feather.replace();
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
            card.addEventListener('click', () => {
                // В будущем здесь будет открытие детальной информации о тренировке
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 200);
            });
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