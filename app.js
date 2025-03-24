// Инициализация клиента Supabase
// Вставьте сюда ваши реальные данные из Supabase
// Вставьте сюда URL и ключ из вашего проекта Supabase
//
// Для работы с загрузкой изображений необходимо:
// 1. Создать хранилище (bucket) с именем "players" в Supabase
// 2. Настроить публичный доступ для чтения файлов
// 3. Настроить правила доступа для загрузки файлов аутентифицированными пользователями
const SUPABASE_URL = 'https://nthnntlbqwpxnpobbqzl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aG5udGxicXdweG5wb2JicXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0Nzg2NDgsImV4cCI6MjA1ODA1NDY0OH0.KxUhGDwN__ZuRyOHMpL7OQtNIx-Q_Epe29ym5-IhLOA';
// Правильная инициализация клиента Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM элементы
const playersContainer = document.getElementById('players-container');
const loadingMessage = document.getElementById('loading-message');
const addPlayerForm = document.getElementById('add-player-form');
const addPlayerBtn = document.getElementById('add-player-btn');
const addPlayerModal = document.getElementById('add-player-modal');
const editPlayerModal = document.getElementById('edit-player-modal');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const editPlayerForm = document.getElementById('edit-player-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const pagesContainer = document.querySelector('.pages-container');
const addTrainingBtn = document.getElementById('add-training-btn');
const sortByNameBtn = document.getElementById('sort-by-name');
const sortByRatingBtn = document.getElementById('sort-by-rating');

// Переменная для хранения текущего типа сортировки (по умолчанию - по рейтингу)
let currentSortType = 'rating';

// Загрузка игроков и инициализация иконок при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Feather Icons
    if (window.feather) {
        feather.replace();
    }

    // Загружаем игроков
    fetchPlayers();

    // Инициализируем обработчики для модального окна
    initModalHandlers();

    // Инициализируем обработчики для вкладок и свайпа
    initTabsAndSwipe();

    // Инициализируем обработчик для кнопки "Добавить тренировку"
    initTrainingHandlers();

    // Инициализируем обработчики для кнопок сортировки
    initSortHandlers();
});

// Обработка отправки формы добавления игрока
addPlayerForm.addEventListener('submit', handleAddPlayer);

// Функция для инициализации обработчиков модальных окон
function initModalHandlers() {
    // Открытие модального окна добавления при нажатии на кнопку "+"
    addPlayerBtn.addEventListener('click', () => {
        openModal(addPlayerModal);
    });

    // Закрытие модальных окон при нажатии на кнопки "X"
    closeModalBtns.forEach(btn => {
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

    // Закрытие модальных окон при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    });

    // Обработка отправки формы редактирования
    editPlayerForm.addEventListener('submit', handleEditPlayer);

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

// Функция для обновления класса обводки фото в зависимости от рейтинга
function updatePhotoRatingClass(photoElement, rating) {
    // Сначала удаляем все классы рейтинга
    photoElement.classList.remove('rating-blue', 'rating-green', 'rating-yellow', 'rating-orange', 'rating-red');

    // Добавляем соответствующий класс
    if (rating < 300) {
        photoElement.classList.add('rating-blue');
    } else if (rating < 450) {
        photoElement.classList.add('rating-green');
    } else if (rating < 600) {
        photoElement.classList.add('rating-yellow');
    } else if (rating < 800) {
        photoElement.classList.add('rating-orange');
    } else {
        photoElement.classList.add('rating-red');
    }
}

// Функция для открытия модального окна
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы

    // Инициализируем иконки Feather в модальном окне
    if (window.feather) {
        feather.replace();
    }
}

// Функция для закрытия модального окна
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Разблокируем прокрутку страницы
}

// Функция для открытия модального окна редактирования
function openEditModal(player) {
    // Заполняем форму данными игрока
    document.getElementById('editPlayerId').value = player.id;
    document.getElementById('editFirstName').value = player.first_name;
    document.getElementById('editLastName').value = player.last_name;
    document.getElementById('editRating').value = player.rating;

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

// Обработка предпросмотра загруженного изображения
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
    photoPreview.className = 'photo-preview';
    updatePhotoRatingClass(photoPreview, rating);
});

// Функция для обработки редактирования игрока
async function handleEditPlayer(event) {
    event.preventDefault();

    // Получаем данные из формы
    const playerId = document.getElementById('editPlayerId').value;
    const first_name = document.getElementById('editFirstName').value.trim();
    const last_name = document.getElementById('editLastName').value.trim();
    const rating = parseInt(document.getElementById('editRating').value);
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
        // Получаем текущие данные игрока для определения, нужно ли обновлять фото
        const { data: currentPlayer, error: fetchError } = await supabase
            .from('players')
            .select('photo')
            .eq('id', playerId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        let photo = currentPlayer.photo; // По умолчанию оставляем текущее фото

        // Если выбран новый файл, загружаем его в хранилище Supabase
        if (photoFile) {
            // Создаем уникальное имя файла
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`; // Загружаем прямо в корень хранилища

            // Загружаем файл в хранилище
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('players')
                .upload(filePath, photoFile, {
                    cacheControl: '3600',
                    upsert: false // Не перезаписывать файл, если он существует
                });

            if (uploadError) {
                console.error('Ошибка при загрузке файла:', uploadError);
                showMessage('Не удалось загрузить фото. Попробуйте другое изображение.', 'error');
                throw uploadError;
            }

            console.log('Файл успешно загружен:', uploadData);

            // Получаем публичный URL загруженного файла
            const { data: { publicUrl } } = supabase.storage
                .from('players')
                .getPublicUrl(filePath);

            console.log('Публичный URL файла:', publicUrl);

            // Используем URL загруженного файла
            photo = publicUrl;
        }

        // Обновляем данные игрока в базе данных
        const { data, error } = await supabase
            .from('players')
            .update({ first_name, last_name, rating, photo })
            .eq('id', playerId)
            .select();

        if (error) {
            throw error;
        }

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

// Функция для загрузки игроков из Supabase
async function fetchPlayers() {
    try {
        // Запрос к таблице players с учетом текущего типа сортировки
        let query = supabase.from('players').select('*');

        if (currentSortType === 'rating') {
            query = query.order('rating', { ascending: false });
        } else {
            query = query.order('last_name', { ascending: true });
        }

        const { data: players, error } = await query;

        if (error) {
            throw error;
        }

        // Очистка контейнера и удаление сообщения о загрузке
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
    }
}

// Функция для создания карточки игрока
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';

    // Используем дефолтное изображение, если фото не указано
    const photoUrl = player.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(player.first_name + ' ' + player.last_name) + '&background=3498db&color=fff&size=150';

    // Определяем класс для обводки фото в зависимости от рейтинга
    let ratingClass = '';
    if (player.rating < 300) {
        ratingClass = 'rating-blue';
    } else if (player.rating < 450) {
        ratingClass = 'rating-green';
    } else if (player.rating < 600) {
        ratingClass = 'rating-yellow';
    } else if (player.rating < 800) {
        ratingClass = 'rating-orange';
    } else {
        ratingClass = 'rating-red';
    }

    card.innerHTML = `
        <img src="${photoUrl}" alt="${player.first_name} ${player.last_name}" class="player-photo ${ratingClass}">
        <div class="player-info">
            <div class="player-name">${player.first_name} ${player.last_name}</div>
            <div class="player-rating">
                <span class="rating-label">Рейтинг:</span>
                <span class="rating-value ${ratingClass}">${player.rating}</span>
            </div>
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

    // Добавляем обработчик для кнопки редактирования
    const editBtn = card.querySelector('.edit-btn');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        openEditModal(player);
    });

    // Добавляем обработчик для кнопки удаления
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        deletePlayer(player.id);
    });

    // Добавляем обработчик для нажатия на карточку (для мобильных устройств)
    card.addEventListener('click', () => {
        // Можно добавить действие при нажатии на карточку, например, показать детали игрока
        // Пока просто выделяем карточку
        card.classList.add('selected');
        setTimeout(() => card.classList.remove('selected'), 200);
    });

    // Мы не будем инициализировать иконки здесь,
    // а сделаем это после добавления карточки в DOM

    return card;
}

// Функция для добавления нового игрока
async function handleAddPlayer(event) {
    event.preventDefault();

    // Получаем данные из формы
    const first_name = document.getElementById('firstName').value.trim();
    const last_name = document.getElementById('lastName').value.trim();
    const rating = parseInt(document.getElementById('rating').value);
    const photoFile = document.getElementById('photoFile').files[0];

    // Проверка данных
    if (!first_name || !last_name || isNaN(rating)) {
        showMessage('Пожалуйста, заполните все обязательные поля');
        return;
    }

    // Показываем индикатор загрузки
    const submitBtn = addPlayerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Добавление...';
    submitBtn.disabled = true;

    try {
        let photo = null; // По умолчанию фото отсутствует

        // Если выбран файл, загружаем его в хранилище Supabase
        if (photoFile) {
            // Создаем уникальное имя файла
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`; // Загружаем прямо в корень хранилища

            // Загружаем файл в хранилище
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('players')
                .upload(filePath, photoFile, {
                    cacheControl: '3600',
                    upsert: false // Не перезаписывать файл, если он существует
                });

            if (uploadError) {
                console.error('Ошибка при загрузке файла:', uploadError);
                showMessage('Не удалось загрузить фото. Попробуйте другое изображение.', 'error');
                throw uploadError;
            }

            console.log('Файл успешно загружен:', uploadData);

            // Получаем публичный URL загруженного файла
            const { data: { publicUrl } } = supabase.storage
                .from('players')
                .getPublicUrl(filePath);

            console.log('Публичный URL файла:', publicUrl);

            // Используем URL загруженного файла
            photo = publicUrl;
        }

        // Добавляем игрока в базу данных
        const { data, error } = await supabase
            .from('players')
            .insert([
                { first_name, last_name, rating, photo }
            ])
            .select();

        if (error) {
            throw error;
        }

        // Сбрасываем форму и предпросмотр
        addPlayerForm.reset();
        photoPreview.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

        // Обновляем список игроков и инициализируем иконки
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

// Функция для отображения сообщений пользователю
function showMessage(message, type = 'info') {
    // Создаем элемент сообщения
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    // Добавляем элемент в DOM
    document.body.appendChild(messageElement);

    // Анимация появления
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);

    // Удаляем сообщение через 3 секунды
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
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

        // Делаем запрос к API
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);

        if (error) {
            throw error;
        }

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

// Функция для инициализации вкладок и свайпа
function initTabsAndSwipe() {
    // Переменные для отслеживания свайпа
    let touchStartX = 0;
    let touchEndX = 0;
    let currentTab = 0; // 0 - тренировки, 1 - игроки

    // Обработчики для кнопок вкладок
    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            switchToTab(index);
        });
    });

    // Функция переключения на вкладку
    function switchToTab(tabIndex) {
        // Обновляем активную вкладку
        tabButtons.forEach((btn, i) => {
            if (i === tabIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Перемещаем контейнер страниц
        pagesContainer.style.transform = `translateX(${-tabIndex * 50}%)`;

        // Обновляем текущую вкладку
        currentTab = tabIndex;
    }

    // Обработчики для свайпа
    pagesContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    pagesContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    // Обработка свайпа
    function handleSwipe() {
        const swipeThreshold = 100; // Минимальное расстояние для свайпа
        const swipeDistance = touchEndX - touchStartX;

        // Свайп вправо (от игроков к тренировкам)
        if (swipeDistance > swipeThreshold && currentTab === 1) {
            switchToTab(0);
        }
        // Свайп влево (от тренировок к игрокам)
        else if (swipeDistance < -swipeThreshold && currentTab === 0) {
            switchToTab(1);
        }
    }
}

// Функция для инициализации обработчиков тренировок
function initTrainingHandlers() {
    // Обработчик для кнопки "Добавить тренировку"
    addTrainingBtn.addEventListener('click', () => {
        showMessage('Функционал добавления тренировок будет доступен в следующей версии', 'info');
    });
}