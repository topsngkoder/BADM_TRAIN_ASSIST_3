// Главный модуль приложения
import { initPlayersModule } from './players.js';
import { initTrainingsModule } from './trainings.js';
import { initTabsAndSwipe } from './ui.js';

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {

    // Инициализируем Feather Icons
    if (window.feather) {
        feather.replace();
    } else {
        console.error('Feather не доступен');
    }

    

    // Инициализируем модуль игроков
    const playersModule = initPlayersModule();

    // Инициализируем модуль тренировок
    const trainingsModule = initTrainingsModule();

    // Инициализируем вкладки и свайп
    const tabButtons = document.querySelectorAll('.tab-btn');

    const pagesContainer = document.querySelector('.pages-container');

    const tabsController = initTabsAndSwipe(tabButtons, pagesContainer);

    // Инициализируем обработчики для закрытия модальных окон
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    console.log('Инициализация приложения завершена');
});