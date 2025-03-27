// Модуль для обработчиков событий тренировок
import { trainingsApi, playersApi } from './api.js';
import { showMessage, openModal, closeModal } from './ui.js';
import { saveTrainingState, handleWinnerSelection } from './trainings-state.js';
import { addPlayerFromQueueToCourt, removePlayerFromCourt } from './trainings-players.js';
import { updateCourtHalfButtons, updateStartGameButton, startGameTimer, unlockCourtPlayers, updateCourtVisibility } from './trainings-court.js';
import { showWinnerSelectionModal, openPlayerSelectionModal } from './trainings-ui.js';

// Функция для инициализации обработчиков тренировок
export function initTrainingHandlers(elements) {
    const {
        addTrainingBtn,
        addTrainingForm,
        playersSelection,
        addTrainingModal,
        trainingsContainer
    } = elements;

    // Обработчик для кнопки "Добавить тренировку"
    addTrainingBtn.addEventListener('click', () => {
        openAddTrainingModal(playersSelection, addTrainingModal);
    });

    // Обработчик для формы добавления тренировки
    addTrainingForm.addEventListener('submit', (event) => {
        handleAddTraining(event, addTrainingForm, addTrainingModal, trainingsContainer, () => {
            // Функция обратного вызова для обновления списка тренировок
            if (elements.fetchTrainings) {
                elements.fetchTrainings();
            }
        });
    });

    // Инициализируем кнопку "Назад" на странице деталей тренировки
    const backBtn = document.getElementById('back-to-trainings-btn');
    console.log('Кнопка "Назад":', backBtn);
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            console.log('Нажата кнопка "Назад"');

            // Скрываем интерфейс деталей тренировки и показываем основной интерфейс
            console.log('Скрываем интерфейс деталей тренировки и показываем основной интерфейс');

            const trainingDetailsInterface = document.getElementById('training-details-interface');
            console.log('Интерфейс деталей тренировки:', trainingDetailsInterface);
            if (trainingDetailsInterface) {
                trainingDetailsInterface.style.display = 'none';
                console.log('Интерфейс деталей тренировки скрыт');
            } else {
                console.error('Не найден интерфейс деталей тренировки с ID "training-details-interface"');
            }

            const mainInterface = document.getElementById('main-interface');
            console.log('Основной интерфейс:', mainInterface);
            if (mainInterface) {
                mainInterface.style.display = 'block';
                mainInterface.style.width = '100%';
                mainInterface.style.maxWidth = '100%';
                console.log('Основной интерфейс показан');
            } else {
                console.error('Не найден основной интерфейс с ID "main-interface"');
            }

            // Очищаем ID тренировки из URL
            const url = new URL(window.location);
            url.searchParams.delete('id');
            window.history.pushState({}, '', url);
            console.log('ID тренировки удален из URL');
        });
    } else {
        console.error('Не найдена кнопка "Назад" с ID "back-to-trainings-btn"');
    }

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
export async function openAddTrainingModal(playersSelection, addTrainingModal) {
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
export async function handleAddTraining(event, addTrainingForm, addTrainingModal, trainingsContainer, onSuccess) {
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

        // Вызываем callback для обновления списка тренировок
        if (typeof onSuccess === 'function') {
            onSuccess();
        }

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

// Функция для обработки удаления тренировки
export async function handleDeleteTraining(trainingId, cardElement, trainingsContainer) {
    // Запрашиваем подтверждение удаления
    if (!confirm('Вы уверены, что хотите удалить эту тренировку?')) {
        return;
    }

    try {
        // Добавляем класс для анимации удаления
        cardElement.classList.add('removing');

        // Удаляем тренировку через API
        await trainingsApi.deleteTraining(trainingId);

        // Ждем завершения анимации и удаляем элемент из DOM
        setTimeout(() => {
            cardElement.remove();

            // Проверяем, остались ли еще тренировки
            if (trainingsContainer.querySelectorAll('.training-card').length === 0) {
                trainingsContainer.innerHTML = '<p>У вас пока нет тренировок.</p>';
            }

            // Показываем сообщение об успешном удалении
            showMessage('Тренировка успешно удалена', 'success');
        }, 300); // Время должно соответствовать длительности анимации в CSS
    } catch (error) {
        console.error('Ошибка при удалении тренировки:', error);

        // Убираем класс анимации
        cardElement.classList.remove('removing');

        // Показываем сообщение об ошибке
        showMessage('Не удалось удалить тренировку', 'error');
    }
}

// Функция для инициализации обработчиков деталей тренировки
export function initTrainingDetailsHandlers(detailsContainer, saveTrainingState) {
    // Флаг для отслеживания процесса добавления игрока
    let isAddingPlayer = false;

    // Обработчики для кнопок "Добавить из очереди"
    const addFromQueueButtons = detailsContainer.querySelectorAll('.add-from-queue-btn');

    addFromQueueButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();

            // Если процесс добавления уже идет, игнорируем клик
            if (isAddingPlayer) {
                return;
            }

            const courtId = button.getAttribute('data-court');
            const half = button.getAttribute('data-half');

            // Проверяем, есть ли игроки в очереди
            const queuePlayers = detailsContainer.querySelectorAll('.queue-player-card:not(.removing)');
            if (queuePlayers.length === 0) {
                showMessage('В очереди нет игроков', 'warning');
                return;
            }

            // Устанавливаем флаг, что процесс добавления начался
            isAddingPlayer = true;

            // Визуально блокируем кнопку
            button.classList.add('disabled');

            // Добавляем первого игрока из очереди на корт
            addPlayerFromQueueToCourt(queuePlayers[0], courtId, half, () => {
                // Callback после завершения анимации
                isAddingPlayer = false;
                button.classList.remove('disabled');

                // Обновляем кнопку "Начать игру" для этого корта без сохранения состояния
                const courtContainer = detailsContainer.querySelector(`.court-container[data-court-id="${courtId}"]`);
                if (courtContainer) {
                    console.log('Обновляем кнопку "Начать игру" после добавления игрока на корт', courtId);
                    updateCourtVisibility(courtContainer);

                    // Проверяем, все ли слоты заняты, и если да, то инициализируем кнопку "Начать игру"
                    const slots = courtContainer.querySelectorAll('.court-player-slot');
                    let occupiedSlots = 0;
                    slots.forEach(slot => {
                        if (slot.children.length > 0) {
                            occupiedSlots++;
                        }
                    });

                    if (occupiedSlots === 4) {
                        console.log('Все 4 слота заняты, инициализируем кнопку "Начать игру"');
                        updateStartGameButton(courtContainer, (buttonElement, courtId) => {
                            console.log('Вызван обработчик нажатия кнопки "Начать игру" для корта', courtId);
                            startGameTimer(buttonElement, courtId,
                                // Обработчик отмены игры
                                async (buttonElement, timerInterval) => {
                                    console.log('Вызван обработчик отмены игры');
                                    await saveTrainingState();
                                },
                                // Обработчик завершения игры
                                (buttonElement, courtId, formattedTime, timerInterval) => {
                                    console.log('Вызван обработчик завершения игры');
                                    // Получаем текущий режим тренировки
                                    const trainingModeSelect = document.getElementById('training-mode');
                                    const currentMode = trainingModeSelect ? trainingModeSelect.value : 'single';

                                    // Обрабатываем завершение игры в зависимости от режима
                                    if (currentMode === 'single') {
                                        // Режим "Играем один раз"
                                        // Получаем игроков на корте
                                        const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                                        if (!courtElement) {
                                            console.error('Не найден элемент корта');
                                            return;
                                        }

                                        // Получаем игроков верхней половины
                                        const topPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="top"] .court-player'))
                                            .map(playerElement => {
                                                const playerId = playerElement.getAttribute('data-player-id');
                                                const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                                const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                                return { id: playerId, name: playerName, photo: playerPhoto };
                                            });

                                        // Получаем игроков нижней половины
                                        const bottomPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="bottom"] .court-player'))
                                            .map(playerElement => {
                                                const playerId = playerElement.getAttribute('data-player-id');
                                                const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                                const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                                return { id: playerId, name: playerName, photo: playerPhoto };
                                            });

                                        // Проверяем, что на корте 4 игрока
                                        if (topPlayers.length === 2 && bottomPlayers.length === 2) {
                                            // Формируем названия команд
                                            const topTeamName = `${topPlayers[0].name}/${topPlayers[1].name}`;
                                            const bottomTeamName = `${bottomPlayers[0].name}/${bottomPlayers[1].name}`;

                                            // Показываем модальное окно выбора победителя
                                            showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, formattedTime,
                                                (courtId, winnerTeam, topPlayers, bottomPlayers) => {
                                                    handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers, saveTrainingState);
                                                });
                                        } else {
                                            // Если на корте не 4 игрока, просто показываем сообщение о завершении
                                            showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                                            resetGameButton();
                                        }
                                    } else {
                                        // Другие режимы (пока просто показываем сообщение)
                                        showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                                        resetGameButton();
                                    }

                                    // Функция для сброса кнопки в исходное состояние
                                    function resetGameButton() {
                                        // Очищаем интервал таймера, если он есть
                                        if (timerInterval) {
                                            clearInterval(timerInterval);
                                        }

                                        // Удаляем атрибуты таймера
                                        buttonElement.removeAttribute('data-timer-id');
                                        buttonElement.removeAttribute('data-start-time');

                                        // Сбрасываем внешний вид кнопки
                                        buttonElement.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                                        buttonElement.classList.remove('timer-active');
                                        buttonElement.classList.remove('timer-transition');
                                        buttonElement.style.pointerEvents = '';
                                        buttonElement.title = '';

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
                                    }
                                },
                                saveTrainingState
                            );
                        });
                    }
                }
            }, null);
        });
    });

    // Обработчики для кнопок "+" (добавить выбранного игрока)
    const addPlayerButtons = detailsContainer.querySelectorAll('.add-player-btn');
    console.log('Найдено кнопок добавления выбранного игрока:', addPlayerButtons.length);

    addPlayerButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const courtId = button.getAttribute('data-court');
            const half = button.getAttribute('data-half');
            console.log(`Нажата кнопка добавления выбранного игрока на корт ${courtId}, половина ${half}`);

            // Проверяем, есть ли игроки в очереди
            const queuePlayers = detailsContainer.querySelectorAll('.queue-player-card:not(.removing)');
            if (queuePlayers.length === 0) {
                showMessage('В очереди нет игроков', 'warning');
                return;
            }

            // Создаем модальное окно для выбора игрока
            openPlayerSelectionModal(courtId, half, queuePlayers, (playerCard, courtId, half) => {
                addPlayerFromQueueToCourt(playerCard, courtId, half, null, null);
            });
        });
    });

    // Инициализируем видимость кнопок на всех половинах кортов
    const courtHalves = detailsContainer.querySelectorAll('.court-half');
    courtHalves.forEach(half => {
        updateCourtHalfButtons(half);
    });

    // Обновляем кнопки "Начать игру" для всех кортов после обновления видимости кнопок на половинах кортов
    console.log('Обновляем кнопки "Начать игру" для всех кортов');

    // Инициализируем кнопки "Начать игру" для всех кортов
    const courtContainers = detailsContainer.querySelectorAll('.court-container');
    console.log('Найдено контейнеров кортов:', courtContainers.length);

    courtContainers.forEach(court => {
        console.log('Инициализация кнопки "Начать игру" для корта:', court.getAttribute('data-court-id'));

        // Сначала обновляем видимость кнопки
        updateCourtVisibility(court);

        // Затем добавляем обработчик
        updateStartGameButton(court, (buttonElement, courtId) => {
            console.log('Вызван обработчик нажатия кнопки "Начать игру" для корта', courtId);
            startGameTimer(buttonElement, courtId,
                // Обработчик отмены игры
                async (buttonElement, timerInterval) => {
                    console.log('Вызван обработчик отмены игры');
                    await saveTrainingState();
                },
                // Обработчик завершения игры
                (buttonElement, courtId, formattedTime, timerInterval) => {
                    console.log('Вызван обработчик завершения игры');
                    // Получаем текущий режим тренировки
                    const trainingModeSelect = document.getElementById('training-mode');
                    const currentMode = trainingModeSelect ? trainingModeSelect.value : 'single';

                    // Обрабатываем завершение игры в зависимости от режима
                    if (currentMode === 'single') {
                        // Режим "Играем один раз"
                        // Получаем игроков на корте
                        const courtElement = document.querySelector(`.court-container[data-court-id="${courtId}"]`);
                        if (!courtElement) {
                            console.error('Не найден элемент корта');
                            return;
                        }

                        // Получаем игроков верхней половины
                        const topPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="top"] .court-player'))
                            .map(playerElement => {
                                const playerId = playerElement.getAttribute('data-player-id');
                                const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                return { id: playerId, name: playerName, photo: playerPhoto };
                            });

                        // Получаем игроков нижней половины
                        const bottomPlayers = Array.from(courtElement.querySelectorAll('.court-half[data-half="bottom"] .court-player'))
                            .map(playerElement => {
                                const playerId = playerElement.getAttribute('data-player-id');
                                const playerName = playerElement.querySelector('.court-player-name').textContent.trim();
                                const playerPhoto = playerElement.querySelector('.court-player-photo').src;
                                return { id: playerId, name: playerName, photo: playerPhoto };
                            });

                        // Проверяем, что на корте 4 игрока
                        if (topPlayers.length === 2 && bottomPlayers.length === 2) {
                            // Формируем названия команд
                            const topTeamName = `${topPlayers[0].name}/${topPlayers[1].name}`;
                            const bottomTeamName = `${bottomPlayers[0].name}/${bottomPlayers[1].name}`;

                            // Показываем модальное окно выбора победителя
                            showWinnerSelectionModal(courtId, topTeamName, bottomTeamName, topPlayers, bottomPlayers, formattedTime, 
                                (courtId, winnerTeam, topPlayers, bottomPlayers) => {
                                    handleWinnerSelection(courtId, winnerTeam, topPlayers, bottomPlayers, saveTrainingState);
                                });
                        } else {
                            // Если на корте не 4 игрока, просто показываем сообщение о завершении
                            showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                            resetGameButton();
                        }
                    } else {
                        // Другие режимы (пока просто показываем сообщение)
                        showMessage(`Игра завершена. Продолжительность: ${formattedTime}`, 'success');
                        resetGameButton();
                    }

                    // Функция для сброса кнопки в исходное состояние
                    function resetGameButton() {
                        // Очищаем интервал таймера, если он есть
                        if (timerInterval) {
                            clearInterval(timerInterval);
                        }

                        // Удаляем атрибуты таймера
                        buttonElement.removeAttribute('data-timer-id');
                        buttonElement.removeAttribute('data-start-time');

                        // Сбрасываем внешний вид кнопки
                        buttonElement.innerHTML = '<i data-feather="play-circle"></i> Начать игру';
                        buttonElement.classList.remove('timer-active');
                        buttonElement.classList.remove('timer-transition');
                        buttonElement.style.pointerEvents = '';
                        buttonElement.title = '';

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
                    }
                },
                saveTrainingState
            );
        });
    });

    // Инициализируем иконки Feather
    if (window.feather) {
        feather.replace();
    }
}