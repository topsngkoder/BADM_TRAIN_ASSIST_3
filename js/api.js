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
            const trainingInsertData = {
                venue: trainingData.venue,
                date: trainingData.date,
                time: trainingData.time,
                court_count: parseInt(trainingData.courtCount),
                player_ids: trainingData.players && trainingData.players.length > 0
                    ? trainingData.players.map(id => parseInt(id))
                    : []
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
    // Сохранение состояния тренировки
    async saveTrainingState(trainingId, stateData) {
        try {
            console.log(`Сохранение состояния тренировки с ID: ${trainingId}`);

            // Преобразуем ID в число, если он передан как строка
            const numericId = parseInt(trainingId);
            if (isNaN(numericId)) {
                throw new Error(`Некорректный ID тренировки: ${trainingId}`);
            }

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

            console.log('Состояние тренировки успешно обновлено:', data);
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

            // Получаем тренировку с состоянием из базы данных
            const { data, error } = await supabase
                .from('trainings')
                .select('state_data')
                .eq('id', numericId)
                .single();

            if (error) {
                console.error('Ошибка при получении состояния тренировки:', error);
                throw error; // Выбрасываем ошибку, чтобы она была обработана выше
            }

            // Если данные найдены и есть состояние, возвращаем его
            if (data && data.state_data) {
                console.log('Получено состояние тренировки:', data);
                return { state_data: data.state_data };
            }

            // Если состояние не найдено, возвращаем null
            console.log('Состояние тренировки не найдено в базе данных');
            return null;
        } catch (error) {
            console.error('Error getting training state:', error);
            throw error;
        }
    },

    // Получение очереди игроков для тренировки
    async getPlayersQueue(trainingId) {
        try {
            console.log(`Получение очереди игроков для тренировки с ID: ${trainingId}`);

            // Получаем состояние тренировки
            const trainingState = await this.getTrainingState(trainingId);

            // Если есть состояние и в нем есть очередь игроков, возвращаем ее
            if (trainingState && trainingState.state_data && trainingState.state_data.playersQueue) {
                console.log('Получена очередь игроков из состояния тренировки:', trainingState.state_data.playersQueue);
                return trainingState.state_data.playersQueue;
            }

            // Если очереди нет, возвращаем пустой массив
            console.log('Очередь игроков не найдена в состоянии тренировки');
            return [];
        } catch (error) {
            console.error('Error getting players queue:', error);
            throw error;
        }
    },

    // Обновление очереди игроков для тренировки
    async updatePlayersQueue(trainingId, playersQueue) {
        try {
            console.log(`Обновление очереди игроков для тренировки с ID: ${trainingId}`);

            // Получаем текущее состояние тренировки
            const trainingState = await this.getTrainingState(trainingId);

            // Если состояние не найдено, создаем новое
            let stateData = trainingState && trainingState.state_data ?
                trainingState.state_data :
                { trainingId, courts: [], courtCount: 0 };

            // Обновляем очередь игроков
            stateData.playersQueue = playersQueue;
            stateData.lastUpdated = new Date().toISOString();

            // Сохраняем обновленное состояние
            await this.saveTrainingState(trainingId, stateData);

            console.log('Очередь игроков успешно обновлена');
            return true;
        } catch (error) {
            console.error('Error updating players queue:', error);
            throw error;
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

            // Обновляем очередь в базе данных
            await this.updatePlayersQueue(trainingId, updatedQueue);

            console.log('Игрок успешно удален из очереди');
            return true;
        } catch (error) {
            console.error('Error removing player from queue:', error);
            throw error;
        }
    }
};

// API для работы с игроками
export const playersApi = {
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
            return data;
        } catch (error) {
            console.error('Error fetching players:', error);
            throw error;
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
            return data;
        } catch (error) {
            console.error('Error adding player:', error);
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