// Модуль для работы с тренировками
import { showMessage } from './ui.js';

// Инициализация модуля тренировок
export function initTrainingsModule() {
    // DOM элементы
    const addTrainingBtn = document.getElementById('add-training-btn');
    
    // Инициализация обработчиков
    initTrainingHandlers();
    
    // Функция для инициализации обработчиков тренировок
    function initTrainingHandlers() {
        // Обработчик для кнопки "Добавить тренировку"
        addTrainingBtn.addEventListener('click', () => {
            showMessage('Функционал добавления тренировок будет доступен в следующей версии', 'info');
        });
    }
    
    // Возвращаем публичные методы и свойства
    return {
        // Здесь будут методы для работы с тренировками в будущем
    };
}