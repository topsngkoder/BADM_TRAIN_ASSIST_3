// Сервисный слой для работы с Supabase API
import { config } from './config.js';

// Инициализация клиента Supabase
const supabase = window.supabase.createClient(
    config.supabase.url,
    config.supabase.key
);

// API для работы с тренировками
export const trainingsApi = {
    // Получение тренировки по ID
    async getTrainingById(trainingId) {
        try {
            console.log(`Получение тренировки с ID: ${trainingId}`);

            // Преобразуем ID в число, если он передан как строка
            const numericId = parseInt(trainingId);
            if (isNaN(numericId)) {
                throw new Error(`Некорректный ID тренировки: ${trainingId}`);
            }

            // Получаем тренировку по ID
            const { data, error } = await supabase
                .from('trainings')
                .select('*')
                .eq('id', numericId)
                .single();

            if (error) {
                console.error(`Ошибка при получении тренировки с ID ${numericId}:`, error);
                throw error;
            }

            if (!data) {
                console.warn(`Тренировка с ID ${numericId} не найдена`);
                return null;
            }

            console.log(`Получена тренировка:`, data);

            // Проверяем, есть ли у тренировки поле player_ids
            if (!data.player_ids || !Array.isArray(data.player_ids) || data.player_ids.length === 0) {
                console.log(`У тренировки ${numericId} нет игроков`);
                return data; // Возвращаем тренировку без игроков
            }

            // Получаем данные игроков
            const playerIds = data.player_ids;
            const { data: players, error: playersError } = await supabase
                .from('players')
                .select('*')
                .in('id', playerIds);

            if (playersError) {
                console.error(`Ошибка при получении данных игроков для тренировки ${numericId}:`, playersError);
                return data; // Возвращаем тренировку без игроков
            }

            // Формируем структуру данных с игроками
            return {
                ...data,
                training_players: players.map(player => ({
                    player_id: player.id,
                    training_id: numericId,
                    players: player
                }))
            };
        } catch (error) {
            console.error('Error getting training by ID:', error);
            throw error;
        }
    },
    // Получение списка тренировок
    async getTrainings() {
        try {
            console.log('Запрос на получение тренировок');

            // Сначала проверяем, существует ли таблица trainings
            try {
                const { data: checkData, error: checkError } = await supabase
                    .from('trainings')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.error('Ошибка при проверке таблицы trainings:', checkError);
                    return []; // Возвращаем пустой массив, если таблица не существует
                }
            } catch (checkErr) {
                console.error('Ошибка при проверке таблицы:', checkErr);
                return []; // Возвращаем пустой массив в случае ошибки
            }

            // Получаем все тренировки
            const { data: trainings, error: trainingsError } = await supabase
                .from('trainings')
                .select('*')
                .order('date', { ascending: false });

            if (trainingsError) {
                console.error('Ошибка при получении тренировок:', trainingsError);
                throw trainingsError;
            }

            console.log('Получены тренировки:', trainings);

            // Если тренировок нет, возвращаем пустой массив
            if (!trainings || trainings.length === 0) {
                return [];
            }

            // Для каждой тренировки получаем связанных игроков
            const trainingsWithPlayers = await Promise.all(trainings.map(async (training) => {
                try {
                    // Проверяем, есть ли у тренировки поле player_ids
                    if (!training.player_ids || !Array.isArray(training.player_ids) || training.player_ids.length === 0) {
                        console.log(`У тренировки ${training.id} нет игроков`);
                        return training; // Возвращаем тренировку без игроков
                    }

                    // Получаем данные игроков
                    const playerIds = training.player_ids;
                    const { data: players, error: playersError } = await supabase
                        .from('players')
                        .select('*')
                        .in('id', playerIds);

                    if (playersError) {
                        console.error(`Ошибка при получении данных игроков для тренировки ${training.id}:`, playersError);
                        return training; // Возвращаем тренировку без игроков
                    }

                    // Формируем структуру данных, аналогичную join-запросу
                    return {
                        ...training,
                        training_players: players.map(player => ({
                            player_id: player.id,
                            training_id: training.id,
                            players: player
                        }))
                    };
                } catch (error) {
                    console.error(`Ошибка при обработке тренировки ${training.id}:`, error);
                    return training; // Возвращаем тренировку без игроков в случае ошибки
                }
            }));

            console.log('Получены тренировки с игроками:', trainingsWithPlayers);
            return trainingsWithPlayers;
        } catch (error) {
            console.error('Error fetching trainings:', error);
            throw error;
        }
    },

    // Добавление новой тренировки
    async addTraining(trainingData) {
        try {
            console.log('Добавление тренировки с данными:', trainingData);

            // Проверяем, существуют ли таблицы
            const { data: tables, error: tablesError } = await supabase
                .from('trainings')
                .select('id')
                .limit(1);

            if (tablesError) {
                console.error('Ошибка при проверке таблицы trainings:', tablesError);
                throw new Error('Таблица trainings не существует или недоступна. Пожалуйста, создайте таблицу в Supabase.');
            }

            // Подготавливаем данные тренировки, включая список ID игроков
            const playerIds = trainingData.players && trainingData.players.length > 0
                ? trainingData.players.map(id => parseInt(id))
                : [];

            // Создаем начальное состояние тренировки
            const initialState = {
                trainingId: null, // ID будет установлен после создания тренировки
                courts: [],
                playersQueue: playerIds.map(id => ({ id: String(id) })),
                courtCount: parseInt(trainingData.courtCount),
                trainingMode: 'single',
                lastUpdated: new Date().toISOString()
            };

            const trainingInsertData = {
                venue: trainingData.venue,
                date: trainingData.date,
                time: trainingData.time,
                court_count: parseInt(trainingData.courtCount),
                player_ids: playerIds,
                state_data: initialState
            };

            console.log('Вставка данных тренировки:', trainingInsertData);

            const { data: training, error } = await supabase
                .from('trainings')
                .insert([trainingInsertData])
                .select();

            if (error) {
                console.error('Ошибка при добавлении тренировки:', error);
                throw error;
            }

            console.log('Тренировка успешно добавлена:', training);

            // Обновляем trainingId в state_data
            if (training && training[0] && training[0].id) {
                const trainingId = training[0].id;

                // Обновляем state_data с правильным ID тренировки
                const updatedStateData = {
                    ...training[0].state_data,
                    trainingId: trainingId
                };

                // Обновляем запись в базе данных
                const { data: updatedTraining, error: updateError } = await supabase
                    .from('trainings')
                    .update({
                        state_data: updatedStateData
                    })
                    .eq('id', trainingId)
                    .select();

                if (updateError) {
                    console.error('Ошибка при обновлении state_data:', updateError);
                } else {
                    console.log('state_data успешно обновлен с ID тренировки');
                    return updatedTraining[0];
                }
            }

            return training[0];
        } catch (error) {
            console.error('Error adding training:', error);
            throw error;
        }
    },

    // Получение данных одной тренировки
    async getTraining(trainingId) {
        try {
            const { data, error } = await supabase
                .from('trainings')
                .select('*, training_players(*, players(*))')
                .eq('id', trainingId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching training:', error);
            throw error;
        }
    },

    // Удаление тренировки
    async deleteTraining(trainingId) {
        try {
            console.log(`Удаление тренировки с ID: ${trainingId}`);

            // Преобразуем ID в число, если он передан как строка
            const numericId = parseInt(trainingId);
            if (isNaN(numericId)) {
                throw new Error(`Некорректный ID тренировки: ${trainingId}`);
            }

            // Удаляем тренировку
            console.log(`Удаление тренировки ${numericId}`);
            const { error } = await supabase
                .from('trainings')
                .delete()
                .eq('id', numericId);

            if (error) {
                console.error('Ошибка при удалении тренировки:', error);
                throw error;
            }

            console.log(`Тренировка ${numericId} успешно удалена`);
            return true;
        } catch (error) {
            console.error('Error deleting training:', error);
            throw error;
        }
    }
};

// API для работы с состоянием тренировки
export const trainingStateApi = {
    // Локальное хранилище состояния тренировки
    _localState: {
        trainingId: null,
        courts: [],
        playersQueue: [],
        courtCount: 0,
        lastUpdated: null
    },

    // Инициализация локального состояния
    initLocalState(trainingId) {
        console.log(`Инициализация локального состояния для тренировки ${trainingId}`);
        this._localState = {
            trainingId,
            courts: [],
            playersQueue: [],
            courtCount: 0,
            lastUpdated: new Date().toISOString()
        };
    },

    // Получение локального состояния
    getLocalState() {
        return { ...this._localState };
    },
    // Сохранение состояния тренировки
    async saveTrainingState(trainingId, stateData) {
        try {
            console.log(`Сохранение состояния тренировки с ID: ${trainingId}`);
            console.log('Данные состояния для сохранения:', stateData);

            // Преобразуем ID в число, если он передан как строка
            const numericId = parseInt(trainingId);
            if (isNaN(numericId)) {
                throw new Error(`Некорректный ID тренировки: ${trainingId}`);
            }

            // Обновляем локальное хранилище
            this._localState = { ...stateData };
            if (!this._localState.trainingId) {
                this._localState.trainingId = numericId;
            }

            // Проверяем наличие очереди игроков
            if (!stateData.playersQueue) {
                console.warn('В сохраняемом состоянии нет очереди игроков');
                stateData.playersQueue = [];
            }

            console.log('Очередь игроков в сохраняемом состоянии:', stateData.playersQueue);

            // Обновляем поле state_data в таблице trainings
            const { data, error } = await supabase
                .from('trainings')
                .update({
                    state_data: stateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', numericId)
                .select();

            if (error) {
                console.error('Ошибка при обновлении состояния тренировки:', error);
                throw error;
            }

            console.log('Состояние тренировки успешно обновлено в базе данных:', data);
            return { success: true, data };
        } catch (error) {
            console.error('Error saving training state:', error);
            throw error;
        }
    },

    // Получение состояния тренировки
    async getTrainingState(trainingId) {
        try {
            console.log(`Получение состояния тренировки с ID: ${trainingId}`);

            // Преобразуем ID в число, если он передан как строка
            const numericId = parseInt(trainingId);
            if (isNaN(numericId)) {
                throw new Error(`Некорректный ID тренировки: ${trainingId}`);
            }

            // Всегда пытаемся сначала получить состояние из базы данных
            try {
                // Получаем тренировку с состоянием из базы данных
                const { data, error } = await supabase
                    .from('trainings')
                    .select('state_data')
                    .eq('id', numericId)
                    .single();

                if (error) {
                    console.error('Ошибка при получении состояния тренировки из базы данных:', error);
                } else if (data && data.state_data) {
                    console.log('Получено состояние тренировки из базы данных:', data);

                    // Проверяем наличие очереди игроков
                    if (!data.state_data.playersQueue) {
                        console.warn('В полученном состоянии нет очереди игроков');
                        data.state_data.playersQueue = [];
                    }

                    console.log('Очередь игроков в полученном состоянии:', data.state_data.playersQueue);

                    // Обновляем локальное хранилище
                    this._localState = { ...data.state_data };
                    if (!this._localState.trainingId) {
                        this._localState.trainingId = numericId;
                    }

                    return { state_data: { ...this._localState } };
                }
            } catch (dbError) {
                console.error('Ошибка при запросе к базе данных:', dbError);
            }

            // Если состояние не найдено в базе данных, проверяем локальное хранилище
            if (this._localState.trainingId === numericId) {
                console.log('Используем состояние тренировки из локального хранилища:', this._localState);
                console.log('Очередь игроков в локальном хранилище:', this._localState.playersQueue);

                // Сохраняем локальное состояние в базу данных
                try {
                    await this.saveTrainingState(numericId, this._localState);
                    console.log('Локальное состояние сохранено в базу данных');
                } catch (saveError) {
                    console.error('Ошибка при сохранении локального состояния в базу данных:', saveError);
                }

                return { state_data: { ...this._localState } };
            }

            // Если состояние не найдено ни в базе данных, ни в локальном хранилище, создаем новое
            console.log('Состояние тренировки не найдено, создаем новое состояние');

            // Получаем данные тренировки
            try {
                const training = await this.getTrainingById(numericId);
                if (training) {
                    console.log('Получены данные тренировки для инициализации состояния:', training);

                    // Создаем начальное состояние на основе данных тренировки
                    const initialState = {
                        trainingId: numericId,
                        courts: [],
                        playersQueue: [],
                        courtCount: training.court_count || 1,
                        trainingMode: 'single',
                        lastUpdated: new Date().toISOString()
                    };

                    // Если у тренировки есть игроки, добавляем их в очередь
                    if (training.player_ids && Array.isArray(training.player_ids) && training.player_ids.length > 0) {
                        initialState.playersQueue = training.player_ids.map(id => ({ id: String(id) }));
                        console.log('Добавлены игроки в очередь:', initialState.playersQueue);
                    }

                    // Обновляем локальное хранилище
                    this._localState = { ...initialState };

                    // Сохраняем начальное состояние в базу данных
                    try {
                        await this.saveTrainingState(numericId, initialState);
                        console.log('Начальное состояние сохранено в базу данных');
                    } catch (saveError) {
                        console.error('Ошибка при сохранении начального состояния:', saveError);
                    }

                    return { state_data: { ...initialState } };
                }
            } catch (trainingError) {
                console.error('Ошибка при получении данных тренировки для инициализации состояния:', trainingError);
            }

            // Если не удалось получить данные тренировки, используем пустое состояние
            this.initLocalState(numericId);

            // Сохраняем пустое состояние в базу данных
            try {
                await this.saveTrainingState(numericId, this._localState);
                console.log('Пустое состояние сохранено в базу данных');
            } catch (saveError) {
                console.error('Ошибка при сохранении пустого состояния в базу данных:', saveError);
            }

            return { state_data: { ...this._localState } };
        } catch (error) {
            console.error('Error getting training state:', error);
            // Инициализируем локальное хранилище в случае ошибки
            if (trainingId) {
                this.initLocalState(parseInt(trainingId));
            }
            return { state_data: { ...this._localState } };
        }
    },

    // Получение очереди игроков для тренировки
    async getPlayersQueue(trainingId) {
        try {
            console.log(`Получение очереди игроков для тренировки с ID: ${trainingId}`);

            // Проверяем, есть ли очередь в локальном хранилище
            if (this._localState.trainingId === parseInt(trainingId) && this._localState.playersQueue) {
                console.log('Получена очередь игроков из локального хранилища:', this._localState.playersQueue);
                return [...this._localState.playersQueue];
            }

            try {
                // Получаем состояние тренировки
                const trainingState = await this.getTrainingState(trainingId);

                // Если есть состояние и в нем есть очередь игроков, возвращаем ее
                if (trainingState && trainingState.state_data && trainingState.state_data.playersQueue) {
                    console.log('Получена очередь игроков из состояния тренировки:', trainingState.state_data.playersQueue);
                    return [...trainingState.state_data.playersQueue];
                }
            } catch (stateError) {
                console.error('Ошибка при получении состояния тренировки:', stateError);
            }

            // Если очереди нет, возвращаем пустой массив
            console.log('Очередь игроков не найдена, возвращаем пустой массив');
            return [];
        } catch (error) {
            console.error('Error getting players queue:', error);
            return [];
        }
    },

    // Обновление очереди игроков для тренировки
    async updatePlayersQueue(trainingId, playersQueue) {
        try {
            console.log(`Обновление очереди игроков для тренировки с ID: ${trainingId}`);

            // Преобразуем ID в число
            const numericId = parseInt(trainingId);

            // Обновляем очередь в локальном хранилище
            if (this._localState.trainingId !== numericId) {
                this.initLocalState(numericId);
            }

            this._localState.playersQueue = [...playersQueue];
            this._localState.lastUpdated = new Date().toISOString();

            try {
                // Сохраняем обновленное состояние в базу данных
                await this.saveTrainingState(trainingId, this._localState);
            } catch (saveError) {
                console.error('Ошибка при сохранении состояния в базу данных:', saveError);
                // Продолжаем работу с локальным состоянием
            }

            console.log('Очередь игроков успешно обновлена');
            return true;
        } catch (error) {
            console.error('Error updating players queue:', error);
            return false;
        }
    },

    // Добавление игрока в очередь
    async addPlayerToQueue(trainingId, playerId, position = 'end') {
        try {
            console.log(`Добавление игрока с ID ${playerId} в очередь тренировки ${trainingId}, позиция: ${position}`);

            // Получаем текущую очередь игроков
            const playersQueue = await this.getPlayersQueue(trainingId);

            // Преобразуем playerId в строку для сравнения
            const playerIdStr = String(playerId);

            // Проверяем, есть ли уже игрок с таким ID в очереди
            const existingPlayerIndex = playersQueue.findIndex(p =>
                (p && typeof p === 'object' && 'id' in p) ?
                    String(p.id) === playerIdStr :
                    String(p) === playerIdStr
            );

            // Если игрок уже есть в очереди, удаляем его
            if (existingPlayerIndex !== -1) {
                console.log(`Игрок ${playerId} уже есть в очереди, удаляем его`);
                playersQueue.splice(existingPlayerIndex, 1);
            }

            // Добавляем игрока в очередь в зависимости от позиции
            if (position === 'end') {
                // Добавляем в конец очереди
                console.log(`Добавляем игрока ${playerId} в конец очереди`);
                playersQueue.push({ id: playerIdStr });
            } else {
                // Добавляем в начало очереди
                console.log(`Добавляем игрока ${playerId} в начало очереди`);
                playersQueue.unshift({ id: playerIdStr });
            }

            // Обновляем очередь в базе данных
            await this.updatePlayersQueue(trainingId, playersQueue);

            console.log('Игрок успешно добавлен в очередь');
            return true;
        } catch (error) {
            console.error('Error adding player to queue:', error);
            throw error;
        }
    },

    // Удаление игрока из очереди
    async removePlayerFromQueue(trainingId, playerId) {
        try {
            console.log(`Удаление игрока с ID ${playerId} из очереди тренировки ${trainingId}`);

            // Преобразуем ID в число
            const numericId = parseInt(trainingId);

            // Проверяем, инициализировано ли локальное хранилище
            if (this._localState.trainingId !== numericId) {
                try {
                    // Получаем текущую очередь игроков
                    const playersQueue = await this.getPlayersQueue(trainingId);

                    // Преобразуем playerId в строку для сравнения
                    const playerIdStr = String(playerId);

                    // Удаляем игрока из очереди
                    const updatedQueue = playersQueue.filter(p =>
                        (p && typeof p === 'object' && 'id' in p) ?
                            String(p.id) !== playerIdStr :
                            String(p) !== playerIdStr
                    );

                    // Обновляем очередь
                    await this.updatePlayersQueue(trainingId, updatedQueue);
                } catch (queueError) {
                    console.error('Ошибка при обновлении очереди:', queueError);
                    // Инициализируем локальное хранилище
                    this.initLocalState(numericId);
                }
            } else {
                // Если локальное хранилище уже инициализировано
                // Преобразуем playerId в строку для сравнения
                const playerIdStr = String(playerId);

                // Удаляем игрока из очереди
                this._localState.playersQueue = this._localState.playersQueue.filter(p =>
                    (p && typeof p === 'object' && 'id' in p) ?
                        String(p.id) !== playerIdStr :
                        String(p) !== playerIdStr
                );

                this._localState.lastUpdated = new Date().toISOString();

                try {
                    // Сохраняем обновленное состояние в базу данных
                    await this.saveTrainingState(trainingId, this._localState);
                } catch (saveError) {
                    console.error('Ошибка при сохранении состояния в базу данных:', saveError);
                    // Продолжаем работу с локальным состоянием
                }
            }

            console.log('Игрок успешно удален из очереди');
            return true;
        } catch (error) {
            console.error('Error removing player from queue:', error);
            return false;
        }
    },

    // Добавление игрока на корт
    async addPlayerToCourt(trainingId, courtId, position, playerId) {
        try {
            console.log(`Добавление игрока ${playerId} на корт ${courtId}, позиция: ${position}`);

            // Преобразуем ID в число
            const numericId = parseInt(trainingId);

            // Проверяем, инициализировано ли локальное хранилище
            if (this._localState.trainingId !== numericId) {
                this.initLocalState(numericId);
            }

            // Находим нужный корт или создаем новый
            let court = this._localState.courts.find(c => c.id === courtId);
            if (!court) {
                court = {
                    id: courtId,
                    topPlayers: [],
                    bottomPlayers: [],
                    gameInProgress: false,
                    gameStartTime: null
                };
                this._localState.courts.push(court);
            }

            // Преобразуем playerId в строку
            const playerIdStr = String(playerId);

            // Добавляем игрока на нужную позицию
            if (position.startsWith('top')) {
                const playerIndex = parseInt(position.replace('top', '')) - 1;
                if (!court.topPlayers) court.topPlayers = [];
                court.topPlayers[playerIndex] = { id: playerIdStr };
            } else if (position.startsWith('bottom')) {
                const playerIndex = parseInt(position.replace('bottom', '')) - 1;
                if (!court.bottomPlayers) court.bottomPlayers = [];
                court.bottomPlayers[playerIndex] = { id: playerIdStr };
            }

            // Обновляем состояние тренировки
            this._localState.lastUpdated = new Date().toISOString();

            try {
                // Сохраняем обновленное состояние в базу данных
                await this.saveTrainingState(trainingId, this._localState);
            } catch (saveError) {
                console.error('Ошибка при сохранении состояния в базу данных:', saveError);
                // Продолжаем работу с локальным состоянием
            }

            console.log('Игрок успешно добавлен на корт');
            return true;
        } catch (error) {
            console.error('Error adding player to court:', error);
            return false;
        }
    }
};

// API для работы с игроками
export const playersApi = {
    // Локальное хранилище игроков
    _localPlayers: {},

    // Локальное состояние тренировки
    _localState: {
        courts: [],
        playersQueue: [],
        courtCount: 0,
        lastUpdated: null
    },

    // Инициализация локального хранилища игроков
    initLocalPlayers() {
        console.log('Инициализация локального хранилища игроков');
        this._localPlayers = {};
    },

    // Получение игрока из локального хранилища
    getLocalPlayer(playerId) {
        return this._localPlayers[playerId] || null;
    },

    // Добавление игрока в локальное хранилище
    addLocalPlayer(player) {
        if (!player || !player.id) return;
        this._localPlayers[player.id] = player;
    },

    // Получение всех игроков из локального хранилища
    getAllLocalPlayers() {
        return Object.values(this._localPlayers);
    },

    // Получение списка игроков с сортировкой
    async getPlayers(sortType = 'rating') {
        try {
            let query = supabase.from('players').select('*');

            if (sortType === 'rating') {
                query = query.order('rating', { ascending: false });
            } else {
                query = query.order('last_name', { ascending: true });
            }

            const { data, error } = await query;

            if (error) throw error;

            // Добавляем полученных игроков в локальное хранилище
            if (data && data.length > 0) {
                data.forEach(player => this.addLocalPlayer(player));
            }

            return data;
        } catch (error) {
            console.error('Error fetching players:', error);
            throw error;
        }
    },

    // Получение данных игрока по ID
    async getPlayer(playerId) {
        try {
            console.log(`Получение данных игрока с ID ${playerId}`);

            // Сначала проверяем локальное хранилище
            const localPlayer = this.getLocalPlayer(playerId);
            if (localPlayer) {
                console.log(`Игрок с ID ${playerId} найден в локальном хранилище:`, localPlayer);
                return localPlayer;
            }

            // Если игрока нет в локальном хранилище, запрашиваем из базы данных
            console.log(`Игрок с ID ${playerId} не найден в локальном хранилище, запрашиваем из базы данных`);
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', playerId)
                .single();

            if (error) {
                console.error(`Ошибка при получении игрока с ID ${playerId}:`, error);
                return null;
            }

            if (data) {
                // Добавляем игрока в локальное хранилище
                this.addLocalPlayer(data);
                return data;
            }

            return null;
        } catch (error) {
            console.error(`Ошибка при получении игрока с ID ${playerId}:`, error);
            return null;
        }
    },

    // Добавление нового игрока
    async addPlayer(playerData) {
        try {
            const { data, error } = await supabase
                .from('players')
                .insert([playerData])
                .select();

            if (error) throw error;

            // Добавляем нового игрока в локальное хранилище
            if (data && data.length > 0) {
                this.addLocalPlayer(data[0]);
            }

            return data;
        } catch (error) {
            console.error('Error adding player:', error);
            throw error;
        }
    },

    // Получение данных кортов из локального состояния
    getCourts() {
        console.log('Получение данных кортов из локального состояния');
        return [...this._localState.courts];
    },

    // Обновление данных кортов в локальном состоянии
    updateCourts(courts) {
        console.log('Обновление данных кортов в локальном состоянии');
        this._localState.courts = [...courts];
        this._localState.lastUpdated = new Date().toISOString();
        console.log('Данные кортов обновлены:', this._localState.courts);
        return true;
    },

    // Обновление количества кортов в локальном состоянии
    updateCourtCount(count) {
        console.log(`Обновление количества кортов: ${count}`);
        this._localState.courtCount = count;
        this._localState.lastUpdated = new Date().toISOString();
        return true;
    },

    // Добавление игрока на корт
    addPlayerToCourt(courtId, position, playerId) {
        try {
            console.log(`Добавление игрока ${playerId} на корт ${courtId}, позиция: ${position}`);

            // Получаем текущие данные кортов
            const courts = [...this._localState.courts];

            // Находим нужный корт
            const courtIndex = courts.findIndex(c => c.id === courtId);

            if (courtIndex === -1) {
                // Если корт не найден, создаем новый
                console.log(`Корт ${courtId} не найден, создаем новый`);
                const newCourt = {
                    id: courtId,
                    topPlayers: [],
                    bottomPlayers: [],
                    gameInProgress: false,
                    gameStartTime: null
                };

                // Добавляем игрока на нужную позицию
                if (position.startsWith('top')) {
                    const playerIndex = parseInt(position.replace('top', '')) - 1;
                    newCourt.topPlayers[playerIndex] = { id: String(playerId) };
                } else if (position.startsWith('bottom')) {
                    const playerIndex = parseInt(position.replace('bottom', '')) - 1;
                    newCourt.bottomPlayers[playerIndex] = { id: String(playerId) };
                }

                courts.push(newCourt);
            } else {
                // Если корт найден, добавляем игрока на нужную позицию
                const court = courts[courtIndex];

                if (position.startsWith('top')) {
                    const playerIndex = parseInt(position.replace('top', '')) - 1;
                    if (!court.topPlayers) court.topPlayers = [];
                    court.topPlayers[playerIndex] = { id: String(playerId) };
                } else if (position.startsWith('bottom')) {
                    const playerIndex = parseInt(position.replace('bottom', '')) - 1;
                    if (!court.bottomPlayers) court.bottomPlayers = [];
                    court.bottomPlayers[playerIndex] = { id: String(playerId) };
                }
            }

            // Обновляем данные кортов в локальном состоянии
            this.updateCourts(courts);

            console.log('Игрок успешно добавлен на корт');
            return true;
        } catch (error) {
            console.error('Error adding player to court:', error);
            throw error;
        }
    },

    // Удаление игрока с корта
    removePlayerFromCourt(courtId, position) {
        try {
            console.log(`Удаление игрока с корта ${courtId}, позиция: ${position}`);

            // Получаем текущие данные кортов
            const courts = [...this._localState.courts];

            // Находим нужный корт
            const courtIndex = courts.findIndex(c => c.id === courtId);

            if (courtIndex === -1) {
                console.log(`Корт ${courtId} не найден`);
                return false;
            }

            // Удаляем игрока с нужной позиции
            const court = courts[courtIndex];

            if (position.startsWith('top')) {
                const playerIndex = parseInt(position.replace('top', '')) - 1;
                if (court.topPlayers && court.topPlayers[playerIndex]) {
                    court.topPlayers[playerIndex] = null;
                }
            } else if (position.startsWith('bottom')) {
                const playerIndex = parseInt(position.replace('bottom', '')) - 1;
                if (court.bottomPlayers && court.bottomPlayers[playerIndex]) {
                    court.bottomPlayers[playerIndex] = null;
                }
            }

            // Обновляем данные кортов в локальном состоянии
            this.updateCourts(courts);

            console.log('Игрок успешно удален с корта');
            return true;
        } catch (error) {
            console.error('Error removing player from court:', error);
            throw error;
        }
    },

    // Обновление состояния игры на корте
    updateGameState(courtId, gameInProgress, gameStartTime = null) {
        try {
            console.log(`Обновление состояния игры на корте ${courtId}: ${gameInProgress ? 'в процессе' : 'завершена'}`);

            // Получаем текущие данные кортов
            const courts = [...this._localState.courts];

            // Находим нужный корт
            const courtIndex = courts.findIndex(c => c.id === courtId);

            if (courtIndex === -1) {
                console.log(`Корт ${courtId} не найден`);
                return false;
            }

            // Обновляем состояние игры
            courts[courtIndex].gameInProgress = gameInProgress;
            courts[courtIndex].gameStartTime = gameStartTime;

            // Обновляем данные кортов в локальном состоянии
            this.updateCourts(courts);

            console.log('Состояние игры успешно обновлено');
            return true;
        } catch (error) {
            console.error('Error updating game state:', error);
            throw error;
        }
    },
    
    // Обновление данных игрока
    async updatePlayer(playerId, playerData) {
        try {
            const { data, error } = await supabase
                .from('players')
                .update(playerData)
                .eq('id', playerId)
                .select();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating player:', error);
            throw error;
        }
    },
    
    // Удаление игрока
    async deletePlayer(playerId) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);
                
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting player:', error);
            throw error;
        }
    },
    
    // Получение данных одного игрока
    async getPlayer(playerId) {
        try {
            const { data, error } = await supabase
                .from('players')
                .select('*')
                .eq('id', playerId)
                .single();
                
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching player:', error);
            throw error;
        }
    }
};

// API для работы с файлами
export const storageApi = {
    // Загрузка файла в хранилище
    async uploadFile(file, bucket = 'players') {
        try {
            // Создаем уникальное имя файла
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${fileName}`;
            
            // Загружаем файл
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });
                
            if (error) throw error;
            
            // Получаем публичный URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
                
            return publicUrl;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    },
    
    // Предварительная обработка изображения перед загрузкой
    async processImageBeforeUpload(file, maxWidth = 800, maxHeight = 800) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        // Определяем размеры для сжатия
                        let width = img.width;
                        let height = img.height;
                        
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                        
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                        
                        // Создаем canvas для сжатия
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Рисуем изображение на canvas
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Конвертируем canvas в Blob
                        canvas.toBlob((blob) => {
                            // Создаем новый файл из Blob
                            const processedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            
                            resolve(processedFile);
                        }, file.type, 0.85); // Качество сжатия 85%
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } catch (error) {
                reject(error);
            }
        });
    }
};