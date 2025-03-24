// Главный модуль приложения
import { initPlayersModule } from './players.js';
import { initTrainingsModule } from './trainings.js';
import { initTabsAndSwipe } from './ui.js';

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Инициализация приложения');

    // Инициализируем Feather Icons
    console.log('Инициализация Feather Icons');
    if (window.feather) {
        console.log('Feather доступен, инициализируем иконки');
        feather.replace();
    } else {
        console.error('Feather не доступен');
    }

    // Проверяем наличие всех необходимых элементов
    console.log('Проверка наличия элементов DOM:');
    console.log('- Страница тренировок:', document.getElementById('trainings-section'));
    console.log('- Страница игроков:', document.getElementById('players-section'));
    console.log('- Страница деталей тренировки:', document.getElementById('training-details-section'));
    console.log('- Кнопка "Назад":', document.getElementById('back-to-trainings-btn'));
    console.log('- Контейнер тренировок:', document.getElementById('trainings-container'));

    // Инициализируем модуль игроков
    console.log('Инициализация модуля игроков');
    const playersModule = initPlayersModule();

    // Инициализируем модуль тренировок
    console.log('Инициализация модуля тренировок');
    const trainingsModule = initTrainingsModule();

    // Инициализируем вкладки и свайп
    console.log('Инициализация вкладок и свайпа');
    const tabButtons = document.querySelectorAll('.tab-btn');
    console.log('Кнопки вкладок:', tabButtons.length);

    const pagesContainer = document.querySelector('.pages-container');
    console.log('Контейнер страниц:', pagesContainer);

    const tabsController = initTabsAndSwipe(tabButtons, pagesContainer);

    // Инициализируем обработчики для закрытия модальных окон
    console.log('Инициализация обработчиков для закрытия модальных окон');
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        console.log('Найдена кнопка закрытия модального окна:', btn);
        btn.addEventListener('click', (e) => {
            console.log('Нажата кнопка закрытия модального окна');
            const modal = e.target.closest('.modal');
            if (modal) {
                console.log('Закрытие модального окна:', modal.id);
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    console.log('Инициализация приложения завершена');
});