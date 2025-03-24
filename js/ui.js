// Модуль для работы с UI элементами
import { config } from './config.js';

// Функция для отображения сообщений пользователю
export function showMessage(message, type = 'info') {
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

    // Удаляем сообщение через заданное время
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, config.ui.messageDisplayTime);
}

// Функция для открытия модального окна
export function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Блокируем прокрутку страницы

    // Инициализируем иконки Feather в модальном окне
    if (window.feather) {
        feather.replace();
    }
}

// Функция для закрытия модального окна
export function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Разблокируем прокрутку страницы
}

// Функция для определения класса рейтинга
export function getRatingClass(rating) {
    if (rating < config.ratingThresholds.blue) {
        return 'rating-blue';
    } else if (rating < config.ratingThresholds.green) {
        return 'rating-green';
    } else if (rating < config.ratingThresholds.yellow) {
        return 'rating-yellow';
    } else if (rating < config.ratingThresholds.orange) {
        return 'rating-orange';
    } else {
        return 'rating-red';
    }
}

// Функция для обновления класса обводки фото в зависимости от рейтинга
export function updatePhotoRatingClass(photoElement, rating) {
    // Сначала удаляем все классы рейтинга
    photoElement.classList.remove('rating-blue', 'rating-green', 'rating-yellow', 'rating-orange', 'rating-red');
    
    // Добавляем соответствующий класс
    photoElement.classList.add(getRatingClass(rating));
}

// Функция для создания предпросмотра изображения
export function setupImagePreview(fileInput, previewElement) {
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewElement.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    });
}

// Функция для инициализации обработчиков вкладок и свайпа
export function initTabsAndSwipe(tabButtons, pagesContainer) {
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
        const swipeDistance = touchEndX - touchStartX;

        // Свайп вправо (от игроков к тренировкам)
        if (swipeDistance > config.ui.swipeThreshold && currentTab === 1) {
            switchToTab(0);
        }
        // Свайп влево (от тренировок к игрокам)
        else if (swipeDistance < -config.ui.swipeThreshold && currentTab === 0) {
            switchToTab(1);
        }
    }
    
    // Возвращаем функцию для переключения вкладок, чтобы её можно было использовать извне
    return { switchToTab };
}