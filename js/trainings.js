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

                    playerItem.innerHTML = `
                        <label class="player-checkbox-label">
                            <input type="checkbox" name="selectedPlayers" value="${player.id}">
                            <img src="${photoUrl}" alt="${player.first_name} ${player.last_name}" class="player-checkbox-photo">
                            <div class="player-checkbox-info">
                                <div class="player-checkbox-name">${player.first_name} ${player.last_name}</div>
                                <div class="player-checkbox-rating">Рейтинг: ${player.rating}</div>
                            </div>
                        </label>
                    `;

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

        // Форматируем дату
        const date = new Date(training.date);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Получаем список игроков
        const players = training.training_players ? training.training_players.map(tp => tp.players) : [];

        // Создаем HTML для аватаров игроков
        let playersAvatarsHTML = '';
        if (players.length > 0) {
            playersAvatarsHTML = players.map(player => {
                const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';
                return `<img src="${photoUrl}" alt="${player.first_name} ${player.last_name}" class="training-player-avatar" title="${player.first_name} ${player.last_name}">`;
            }).join('');
        }

        card.innerHTML = `
            <div class="training-header">
                <div class="training-venue">${training.venue}</div>
                <div class="training-datetime">${formattedDate}, ${training.time}</div>
            </div>
            <div class="training-details">
                <div class="training-courts">${training.court_count} ${getCourtWord(training.court_count)}</div>
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