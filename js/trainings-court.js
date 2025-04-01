// Модуль для работы с кортами
import { showMessage } from './ui.js';
import { trainingStateApi } from './api.js';

// Функция для обновления видимости кнопок на половине корта
export function updateCourtHalfButtons(courtHalf) {
    if (!courtHalf) return;

    // Получаем все слоты для игроков на этой половине корта
    const slots = courtHalf.querySelectorAll('.court-player-slot');

    // Считаем количество занятых слотов
    let occupiedSlots = 0;
    slots.forEach(slot => {
        if (slot.children.length > 0) {
            occupiedSlots++;
        }
    });

    // Получаем кнопки на этой половине корта
    const addFromQueueBtn = courtHalf.querySelector('.add-from-queue-btn');
    const addPlayerBtn = courtHalf.querySelector('.add-player-btn');

    // Если все слоты заняты (обычно их 2), скрываем кнопки
    if (occupiedSlots >= slots.length) {
        if (addFromQueueBtn) addFromQueueBtn.style.display = 'none';
        if (addPlayerBtn) addPlayerBtn.style.display = 'none';
    } else {
        // Иначе показываем кнопки
        if (addFromQueueBtn) addFromQueueBtn.style.display = '';
        if (addPlayerBtn) addPlayerBtn.style.display = '';
    }

    // Проверяем, полностью ли заполнен корт (все 4 игрока)
    const courtContainer = courtHalf.closest('.court-container');
    if (courtContainer) {
        // Обновляем только видимость кнопки, но не добавляем обработчик
        updateCourtVisibility(courtContainer);
    }
}

// Функция для проверки заполненности корта и обновления видимости кнопки "Начать игру"
export function updateCourtVisibility(courtContainer) {

    // Получаем все слоты для игроков на этом корте
    const slots = courtContainer.querySelectorAll('.court-player-slot');

    // Считаем количество занятых слотов
    let occupiedSlots = 0;
    slots.forEach(slot => {
        if (slot.children.length > 0) {
            occupiedSlots++;
        }
    });

    // Проверяем, есть ли уже кнопка "Начать игру"
    let startGameBtn = courtContainer.querySelector('.start-game-btn');

    // Проверяем, не идет ли уже игра на этом корте
    const isGameInProgress = courtContainer.classList.contains('game-in-progress');

    // Если все 4 слота заняты и игра не в процессе, показываем кнопку "Начать игру"
    if (occupiedSlots === 4 && !isGameInProgress) {
        // Если кнопка уже есть, показываем ее
        if (startGameBtn) {
            startGameBtn.style.display = '';
        } else {
        }
    } else {
        // Если не все слоты заняты или игра в процессе, скрываем кнопку
        if (startGameBtn) {
            startGameBtn.style.display = 'none';
        }
    }
}

// Функция для проверки заполненности корта и отображения кнопки "Начать игру"
export function updateStartGameButton(courtContainer, onStartGame) {
    // Получаем ID корта
    const courtId = courtContainer.getAttribute('data-court-id');

    // Получаем все слоты для игроков на этом корте
    const slots = courtContainer.querySelectorAll('.court-player-slot');

    // Считаем количество занятых слотов
    let occupiedSlots = 0;
    slots.forEach(slot => {
        if (slot.children.length > 0) {
            occupiedSlots++;
        }
    });

    // Проверяем, есть ли уже кнопка "Начать игру"
    let startGameBtn = courtContainer.querySelector('.start-game-btn');

    // Проверяем, не идет ли уже игра на этом корте
    const isGameInProgress = courtContainer.classList.contains('game-in-progress');

    // Если все 4 слота заняты и игра не в процессе, показываем кнопку "Начать игру"
    if (occupiedSlots === 4 && !isGameInProgress) {
        // Если кнопки еще нет, создаем ее
        if (!startGameBtn) {
            startGameBtn = document.createElement('button');
            startGameBtn.className = 'start-game-btn';
            startGameBtn.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
            startGameBtn.setAttribute('data-court-id', courtId);

            // Добавляем обработчик для кнопки
            startGameBtn.addEventListener('click', () => {
                // Запускаем игру и превращаем кнопку в таймер
                if (onStartGame) {
                    onStartGame(startGameBtn, courtId);
                }
            });

            // Добавляем кнопку в конец контейнера корта
            courtContainer.appendChild(startGameBtn);

            // Инициализируем иконки Feather
            if (window.feather) {
                feather.replace();
            }
        } else {
            // Если кнопка уже есть, показываем ее
            startGameBtn.style.display = '';
        }
    } else {
        // Если не все слоты заняты или игра в процессе, скрываем кнопку
        if (startGameBtn) {
            startGameBtn.style.display = 'none';
        }
    }
}

// Функция для блокировки изменения состава игроков на корте
export function lockCourtPlayers(courtElement) {
    // Скрываем кнопки добавления игроков
    const addButtons = courtElement.querySelectorAll('.add-from-queue-btn, .add-player-btn');
    addButtons.forEach(button => {
        button.style.display = 'none';
    });

    // Скрываем кнопки удаления игроков
    const removeButtons = courtElement.querySelectorAll('.remove-player-btn');
    removeButtons.forEach(button => {
        button.style.display = 'none';
    });

    // Добавляем класс к корту, указывающий, что игра идет
    courtElement.classList.add('game-in-progress');
}

// Функция для разблокировки изменения состава игроков на корте
export function unlockCourtPlayers(courtElement) {
    // Удаляем класс, указывающий, что игра идет
    courtElement.classList.remove('game-in-progress');

    // Обновляем видимость кнопок на всех половинах корта
    const courtHalves = courtElement.querySelectorAll('.court-half');
    courtHalves.forEach(half => {
        updateCourtHalfButtons(half);
    });

    // Показываем кнопки удаления игроков
    const removeButtons = courtElement.querySelectorAll('.remove-player-btn');
    removeButtons.forEach(button => {
        button.style.display = '';
    });
}

// Функция для запуска таймера игры
export function startGameTimer(buttonElement, courtId, onGameCancel, onGameFinish, saveTrainingState) {
    // Проверяем, не запущен ли уже таймер
    if (buttonElement.classList.contains('timer-active')) {
        return;
    }

    // Получаем ID корта и элемент корта
    const courtIdForLock = buttonElement.getAttribute('data-court-id');
    const courtElementForLock = document.querySelector(`.court-container[data-court-id="${courtIdForLock}"]`);
    if (courtElementForLock) {
        // Блокируем возможность изменения состава игроков
        lockCourtPlayers(courtElementForLock);
    }

    // Всегда начинаем таймер с текущего времени
    let startTime = new Date();

    // Устанавливаем новое время начала игры
    buttonElement.setAttribute('data-start-time', startTime.getTime());

    // Обновляем локальное состояние тренировки и сохраняем в базу данных
    if (typeof window.updateLocalTrainingState === 'function') {
        // Здесь будет новая реализация таймера
        window.updateLocalTrainingState()
            .then(() => {
                // Сохраняем состояние в базу данных
                if (saveTrainingState && typeof saveTrainingState === 'function') {
                    // Проверяем, есть ли функция saveTrainingStateWithoutUpdate
                    if (typeof saveTrainingState.withoutUpdate === 'function') {
                        saveTrainingState.withoutUpdate()
                            .catch(saveError => {
                                console.error('Ошибка при сохранении состояния тренировки в базу данных:', saveError);
                            });
                    } else {
                        // Если функции нет, используем обычную функцию saveTrainingState
                        saveTrainingState()
                            .catch(saveError => {
                                console.error('Ошибка при сохранении состояния тренировки в базу данных:', saveError);
                            });
                    }
                }
            })
            .catch(error => {
                console.error('Ошибка при обновлении локального состояния:', error);
            });
    }

    // Создаем контейнер для таймера и кнопок
    const gameControlsContainer = document.createElement('div');
    gameControlsContainer.className = 'game-controls-container';

    // Создаем кнопку "Отмена"
    const cancelButton = document.createElement('button');
    cancelButton.className = 'game-control-btn cancel-btn';
    cancelButton.innerHTML = '<i data-feather="x"></i> Отмена';
    cancelButton.title = 'Отменить игру';

    // Создаем таймер
    const timerElement = document.createElement('div');
    timerElement.className = 'game-timer';
    timerElement.innerHTML = '<i data-feather="clock"></i> 00:00';

    // Создаем кнопку "Игра завершена"
    const finishButton = document.createElement('button');
    finishButton.className = 'game-control-btn finish-btn';
    finishButton.innerHTML = '<i data-feather="check"></i> Игра завершена';
    finishButton.title = 'Завершить игру';

    // Добавляем элементы в контейнер
    gameControlsContainer.appendChild(cancelButton);
    gameControlsContainer.appendChild(timerElement);
    gameControlsContainer.appendChild(finishButton);

    // Заменяем содержимое кнопки на контейнер с элементами управления
    buttonElement.innerHTML = '';
    buttonElement.appendChild(gameControlsContainer);
    buttonElement.classList.add('timer-active');

    // Инициализируем иконки Feather
    if (window.feather) {
        feather.replace();
    }

    // Добавляем обработчики для кнопок
    cancelButton.addEventListener('click', (e) => {
        e.stopPropagation();
        cancelGame(buttonElement, timerInterval);
    });

    finishButton.addEventListener('click', (e) => {
        e.stopPropagation();
        finishGame(buttonElement, timerInterval);
    });

    // Запускаем таймер с использованием сохраненного времени начала игры
    const timerInterval = setInterval(() => {
        // Получаем текущее время
        const currentTime = new Date();

        // Вычисляем разницу в миллисекундах
        const elapsedTime = currentTime - startTime;

        // Преобразуем в минуты и секунды
        const minutes = Math.floor(elapsedTime / 60000);
        const seconds = Math.floor((elapsedTime % 60000) / 1000);

        // Форматируем время
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Обновляем текст таймера
        const timerElement = buttonElement.querySelector('.game-timer');
        if (timerElement) {
            timerElement.innerHTML = `<i data-feather="clock"></i> ${formattedTime}`;

            // Обновляем иконки Feather
            if (window.feather) {
                feather.replace();
            }
        }
    }, 1000);

    // Сохраняем ID интервала в атрибуте кнопки для возможности остановки таймера в будущем
    buttonElement.setAttribute('data-timer-id', timerInterval);

    // Функция для отмены игры
    async function cancelGame(buttonElement, timerInterval) {
        // Останавливаем таймер
        clearInterval(timerInterval);

        // Получаем ID корта
        const courtId = buttonElement.getAttribute('data-court-id');

        // Здесь будет новая реализация удаления информации о таймере

        // Возвращаем кнопку в исходное состояние
        buttonElement.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
        buttonElement.classList.remove('timer-active');
        buttonElement.style.pointerEvents = '';
        buttonElement.title = '';
        buttonElement.removeAttribute('data-timer-id');
        buttonElement.removeAttribute('data-start-time');

        // Инициализируем иконки Feather
        if (window.feather) {
            feather.replace();
        }

        // Получаем элемент корта
        const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
        if (courtElement) {
            // Разблокируем изменение состава игроков
            unlockCourtPlayers(courtElement);
        }

        // Обновляем локальное состояние тренировки
        if (typeof window.updateLocalTrainingState === 'function') {
            try {
                await window.updateLocalTrainingState();
            } catch (error) {
                console.error('Ошибка при обновлении локального состояния после отмены игры:', error);
            }
        }

        // Вызываем переданный обработчик отмены игры
        if (onGameCancel) {
            await onGameCancel(buttonElement, timerInterval);
        }
    }

    // Функция для завершения игры
    function finishGame(buttonElement, timerInterval) {
        // Останавливаем таймер
        clearInterval(timerInterval);

        // Получаем ID корта
        const courtId = buttonElement.getAttribute('data-court-id');

        // Здесь будет новая реализация удаления информации о таймере

        // Получаем время игры
        const startTimeMs = parseInt(buttonElement.getAttribute('data-start-time'));
        const endTimeMs = new Date().getTime();
        const gameDurationMs = endTimeMs - startTimeMs;

        // Преобразуем в минуты и секунды
        const minutes = Math.floor(gameDurationMs / 60000);
        const seconds = Math.floor((gameDurationMs % 60000) / 1000);

        // Форматируем время
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Вызываем переданный обработчик завершения игры
        if (onGameFinish) {
            onGameFinish(buttonElement, courtId, formattedTime, timerInterval);
        }
    }
}