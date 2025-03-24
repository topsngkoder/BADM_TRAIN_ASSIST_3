// Главный модуль приложения
import { initPlayersModule } from './players.js';
import { initTrainingsModule } from './trainings.js';
import { initTabsAndSwipe } from './ui.js';

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Feather Icons
    if (window.feather) {
        feather.replace();
    }
    
    // Инициализируем модуль игроков
    const playersModule = initPlayersModule();
    
    // Инициализируем модуль тренировок
    const trainingsModule = initTrainingsModule();
    
    // Инициализируем вкладки и свайп
    const tabButtons = document.querySelectorAll('.tab-btn');
    const pagesContainer = document.querySelector('.pages-container');
    const tabsController = initTabsAndSwipe(tabButtons, pagesContainer);
});