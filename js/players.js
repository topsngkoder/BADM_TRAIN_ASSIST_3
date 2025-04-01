// Модуль для работы с игроками
import { playersApi, storageApi } from './api.js';
import { showMessage, openModal, closeModal, getRatingClass, updatePhotoRatingClass } from './ui.js';

// Переменная для хранения текущего типа сортировки
let currentSortType = 'rating';

// Инициализация модуля игроков
export function initPlayersModule() {
    // DOM элементы
    const playersContainer = document.getElementById('players-container');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const addPlayerModal = document.getElementById('add-player-modal');
    const editPlayerModal = document.getElementById('edit-player-modal');
    const addPlayerForm = document.getElementById('add-player-form');
    const editPlayerForm = document.getElementById('edit-player-form');
    const sortByNameBtn = document.getElementById('sort-by-name');
    const sortByRatingBtn = document.getElementById('sort-by-rating');
    
    // Инициализация обработчиков
    initModalHandlers();
    initSortHandlers();
    
    // Загрузка игроков
    fetchPlayers();
    
    // Функция для инициализации обработчиков модальных окон
    function initModalHandlers() {
        // Открытие модального окна добавления при нажатии на кнопку "+"
        addPlayerBtn.addEventListener('click', () => {
            openModal(addPlayerModal);
        });
        
        // Закрытие модальных окон при нажатии на кнопки "X"
        document.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                closeModal(modal);
            });
        });
        
        // Закрытие модальных окон при клике вне их содержимого
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
        
        // Обработка отправки формы добавления игрока
        addPlayerForm.addEventListener('submit', handleAddPlayer);
        
        // Обработка отправки формы редактирования игрока
        editPlayerForm.addEventListener('submit', handleEditPlayer);
        
        // Обработка предпросмотра загруженного изображения в форме добавления
        const photoFileInput = document.getElementById('photoFile');
        const photoPreview = document.getElementById('photoPreview');
        
        photoFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Обновление цвета обводки при изменении рейтинга в форме добавления
        const ratingInput = document.getElementById('rating');
        ratingInput.addEventListener('input', function() {
            const rating = parseInt(this.value);
            updatePhotoRatingClass(photoPreview, rating);
        });
        
        // Обработка предпросмотра загруженного изображения в форме редактирования
        const editPhotoFileInput = document.getElementById('editPhotoFile');
        const editPhotoPreview = document.getElementById('editPhotoPreview');
        
        editPhotoFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    editPhotoPreview.src = e.target.result;
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Обновление цвета обводки при изменении рейтинга в форме редактирования
        const editRatingInput = document.getElementById('editRating');
        editRatingInput.addEventListener('input', function() {
            const rating = parseInt(this.value);
            updatePhotoRatingClass(editPhotoPreview, rating);
        });
    }
    
    // Функция для инициализации обработчиков сортировки
    function initSortHandlers() {
        // Обработчик для кнопки "По фамилии"
        sortByNameBtn.addEventListener('click', () => {
            if (currentSortType !== 'name') {
                currentSortType = 'name';
                updateSortButtons();
                fetchPlayers();
            }
        });
        
        // Обработчик для кнопки "По рейтингу"
        sortByRatingBtn.addEventListener('click', () => {
            if (currentSortType !== 'rating') {
                currentSortType = 'rating';
                updateSortButtons();
                fetchPlayers();
            }
        });
        
        // Функция для обновления состояния кнопок сортировки
        function updateSortButtons() {
            if (currentSortType === 'name') {
                sortByNameBtn.classList.add('active');
                sortByRatingBtn.classList.remove('active');
            } else {
                sortByNameBtn.classList.remove('active');
                sortByRatingBtn.classList.add('active');
            }
        }
        
        // Инициализируем состояние кнопок при загрузке
        updateSortButtons();
    }
    
    // Функция для загрузки игроков
    async function fetchPlayers() {
        try {
            // Получаем игроков с учетом текущего типа сортировки
            const players = await playersApi.getPlayers(currentSortType);
            
            // Очистка контейнера
            playersContainer.innerHTML = '';
            
            // Если игроков нет, показываем сообщение
            if (players.length === 0) {
                playersContainer.innerHTML = '<p>Игроки не найдены. Добавьте первого игрока!</p>';
                return;
            }
            
            // Отображение каждого игрока
            players.forEach(player => {
                const playerCard = createPlayerCard(player);
                playersContainer.appendChild(playerCard);
            });
            
            // Инициализируем иконки Feather после добавления всех карточек в DOM
            if (window.feather) {
                feather.replace();
            }
        } catch (error) {
            console.error('Ошибка при загрузке игроков:', error);
            playersContainer.innerHTML = '<p>Произошла ошибка при загрузке игроков. Пожалуйста, попробуйте позже.</p>';
            showMessage('Ошибка при загрузке игроков', 'error');
        }
    }
    
    // Функция для создания карточки игрока
    function createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';

        // Используем дефолтное изображение, если фото не указано
        const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';

        // Определяем класс для обводки фото в зависимости от рейтинга
        const ratingClass = getRatingClass(player.rating);

        // Создаем HTML для ссылки на профиль Badminton4u, если она указана
        const badminton4uLink = player.badminton4u_url
            ? `<div class="player-badminton4u">
                <a href="${player.badminton4u_url}" target="_blank" class="badminton4u-link">
                    <i data-feather="external-link"></i> Профиль Badminton4u
                </a>
              </div>`
            : '';

        card.innerHTML = `
            <img src="${photoUrl}" alt="${player.first_name} ${player.last_name}" class="player-photo ${ratingClass}">
            <div class="player-info">
                <div class="player-name">${player.first_name} ${player.last_name}</div>
                <div class="player-rating">
                    <span class="rating-label">Рейтинг:</span>
                    <span class="rating-value ${ratingClass}">${player.rating}</span>
                </div>
                ${badminton4uLink}
            </div>
            <div class="player-actions">
                <button class="edit-btn" data-id="${player.id}">
                    <i data-feather="edit-2"></i>
                </button>
                <button class="delete-btn" data-id="${player.id}">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
        `;
        
        // Используем делегирование событий для кнопок
        card.addEventListener('click', (e) => {
            // Обработка нажатия на кнопку редактирования
            if (e.target.closest('.edit-btn')) {
                e.stopPropagation();
                openEditModal(player);
            }
            // Обработка нажатия на кнопку удаления
            else if (e.target.closest('.delete-btn')) {
                e.stopPropagation();
                deletePlayer(player.id);
            }
            // Обработка нажатия на карточку
            else {
                card.classList.add('selected');
                setTimeout(() => card.classList.remove('selected'), 200);
            }
        });
        
        return card;
    }
    
    // Функция для открытия модального окна редактирования
    function openEditModal(player) {
        // Заполняем форму данными игрока
        document.getElementById('editPlayerId').value = player.id;
        document.getElementById('editFirstName').value = player.first_name;
        document.getElementById('editLastName').value = player.last_name;
        document.getElementById('editRating').value = player.rating;

        // Заполняем поле ссылки на профиль Badminton4u, если оно есть
        if (player.badminton4u_url) {
            document.getElementById('editBadminton4uUrl').value = player.badminton4u_url;
        } else {
            document.getElementById('editBadminton4uUrl').value = '';
        }

        // Устанавливаем фото игрока в предпросмотр
        const editPhotoPreview = document.getElementById('editPhotoPreview');
        if (player.photo) {
            editPhotoPreview.src = player.photo;
        } else {
            // Используем дефолтное изображение
            editPhotoPreview.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';
        }

        // Обновляем класс обводки в зависимости от рейтинга
        editPhotoPreview.className = 'photo-preview';
        updatePhotoRatingClass(editPhotoPreview, player.rating);

        // Открываем модальное окно
        openModal(editPlayerModal);
    }
    
    // Функция для обработки добавления игрока
    async function handleAddPlayer(event) {
        event.preventDefault();

        // Получаем данные из формы
        const first_name = document.getElementById('firstName').value.trim();
        const last_name = document.getElementById('lastName').value.trim();
        const rating = parseInt(document.getElementById('rating').value);
        const badminton4u_url = document.getElementById('badminton4uUrl').value.trim();
        const photoFile = document.getElementById('photoFile').files[0];

        // Проверка данных
        if (!first_name || !last_name || isNaN(rating)) {
            showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        // Показываем индикатор загрузки
        const submitBtn = addPlayerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Добавление...';
        submitBtn.disabled = true;

        try {
            let photo = null; // По умолчанию фото отсутствует

            // Если выбран файл, обрабатываем и загружаем его
            if (photoFile) {
                // Обрабатываем изображение перед загрузкой
                const processedFile = await storageApi.processImageBeforeUpload(photoFile);

                // Загружаем файл и получаем URL
                photo = await storageApi.uploadFile(processedFile);
            }

            // Добавляем игрока в базу данных
            await playersApi.addPlayer({ first_name, last_name, rating, photo, badminton4u_url });

            // Сбрасываем форму и предпросмотр
            addPlayerForm.reset();
            document.getElementById('photoPreview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

            // Обновляем список игроков
            fetchPlayers();

            // Закрываем модальное окно
            closeModal(addPlayerModal);

            // Показываем сообщение об успехе
            showMessage('Игрок успешно добавлен!', 'success');
        } catch (error) {
            console.error('Ошибка при добавлении игрока:', error);
            showMessage('Произошла ошибка при добавлении игрока', 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
    
    // Функция для обработки редактирования игрока
    async function handleEditPlayer(event) {
        event.preventDefault();

        // Получаем данные из формы
        const playerId = document.getElementById('editPlayerId').value;
        const first_name = document.getElementById('editFirstName').value.trim();
        const last_name = document.getElementById('editLastName').value.trim();
        const rating = parseInt(document.getElementById('editRating').value);
        const badminton4u_url = document.getElementById('editBadminton4uUrl').value.trim();
        const photoFile = document.getElementById('editPhotoFile').files[0];

        // Проверка данных
        if (!first_name || !last_name || isNaN(rating)) {
            showMessage('Пожалуйста, заполните все обязательные поля', 'error');
            return;
        }

        // Показываем индикатор загрузки
        const submitBtn = editPlayerForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Сохранение...';
        submitBtn.disabled = true;

        try {
            // Получаем текущие данные игрока
            const currentPlayer = await playersApi.getPlayer(playerId);

            let photo = currentPlayer.photo; // По умолчанию оставляем текущее фото

            // Если выбран новый файл, обрабатываем и загружаем его
            if (photoFile) {
                // Обрабатываем изображение перед загрузкой
                const processedFile = await storageApi.processImageBeforeUpload(photoFile);

                // Загружаем файл и получаем URL
                photo = await storageApi.uploadFile(processedFile);
            }

            // Обновляем данные игрока
            await playersApi.updatePlayer(playerId, { first_name, last_name, rating, photo, badminton4u_url });

            // Сбрасываем форму
            editPlayerForm.reset();

            // Закрываем модальное окно
            closeModal(editPlayerModal);

            // Обновляем список игроков
            fetchPlayers();

            // Показываем сообщение об успехе
            showMessage('Игрок успешно обновлен!', 'success');
        } catch (error) {
            console.error('Ошибка при обновлении игрока:', error);
            showMessage('Произошла ошибка при обновлении игрока', 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    }
    
    // Функция для удаления игрока
    async function deletePlayer(playerId) {
        if (!confirm('Вы уверены, что хотите удалить этого игрока?')) {
            return;
        }
        
        try {
            // Находим карточку игрока и добавляем класс для анимации удаления
            const playerCard = document.querySelector(`.delete-btn[data-id="${playerId}"]`).closest('.player-card');
            playerCard.classList.add('removing');
            
            // Удаляем игрока
            await playersApi.deletePlayer(playerId);
            
            // Ждем завершения анимации и обновляем список
            setTimeout(() => {
                fetchPlayers();
                showMessage('Игрок успешно удален!', 'success');
            }, 300);
        } catch (error) {
            console.error('Ошибка при удалении игрока:', error);
            showMessage('Произошла ошибка при удалении игрока', 'error');
        }
    }
    
    // Возвращаем публичные методы и свойства
    return {
        fetchPlayers,
        getCurrentSortType: () => currentSortType
    };
}