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

            // Проверяем, существует ли таблица training_states
            try {
                const { data: checkData, error: checkError } = await supabase
                    .from('training_states')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.error('Ошибка при проверке таблицы training_states:', checkError);

                    // Если таблица не существует, создаем ее
                    console.log('Таблица training_states не существует, используем sessionStorage');

                    // Сохраняем состояние только в sessionStorage
                    sessionStorage.setItem('trainingState', JSON.stringify(stateData));
                    return { success: true, message: 'Состояние сохранено в sessionStorage' };
                }
            } catch (checkErr) {
                console.error('Ошибка при проверке таблицы:', checkErr);

                // Сохраняем состояние только в sessionStorage
                sessionStorage.setItem('trainingState', JSON.stringify(stateData));
                return { success: true, message: 'Состояние сохранено в sessionStorage' };
            }

            // Проверяем, есть ли уже сохраненное состояние для этой тренировки
            const { data: existingState, error: getError } = await supabase
                .from('training_states')
                .select('id')
                .eq('training_id', trainingId)
                .single();

            if (getError && getError.code !== 'PGRST116') { // PGRST116 - ошибка "не найдено", это нормально
                console.error('Ошибка при проверке существующего состояния:', getError);
                throw getError;
            }

            if (existingState) {
                // Если состояние уже существует, обновляем его
                console.log(`Обновление существующего состояния для тренировки ${trainingId}`);

                const { data, error } = await supabase
                    .from('training_states')
                    .update({
                        state_data: stateData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('training_id', trainingId)
                    .select();

                if (error) {
                    console.error('Ошибка при обновлении состояния тренировки:', error);
                    throw error;
                }

                console.log('Состояние тренировки успешно обновлено:', data);
                return data;
            } else {
                // Если состояния еще нет, создаем новое
                console.log(`Создание нового состояния для тренировки ${trainingId}`);

                const { data, error } = await supabase
                    .from('training_states')
                    .insert([{
                        training_id: trainingId,
                        state_data: stateData,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select();

                if (error) {
                    console.error('Ошибка при создании состояния тренировки:', error);
                    throw error;
                }

                console.log('Состояние тренировки успешно создано:', data);
                return data;
            }
        } catch (error) {
            console.error('Error saving training state:', error);

            // В случае ошибки сохраняем состояние только в sessionStorage
            sessionStorage.setItem('trainingState', JSON.stringify(stateData));
            return { success: true, message: 'Состояние сохранено в sessionStorage (fallback)' };
        }
    },

    // Получение состояния тренировки
    async getTrainingState(trainingId) {
        try {
            console.log(`Получение состояния тренировки с ID: ${trainingId}`);

            // Проверяем, существует ли таблица training_states
            try {
                const { data: checkData, error: checkError } = await supabase
                    .from('training_states')
                    .select('id')
                    .limit(1);

                if (checkError) {
                    console.error('Ошибка при проверке таблицы training_states:', checkError);

                    // Если таблица не существует, используем данные из sessionStorage
                    console.log('Таблица training_states не существует, используем sessionStorage');

                    const stateJson = sessionStorage.getItem('trainingState');
                    if (stateJson) {
                        try {
                            const stateData = JSON.parse(stateJson);
                            return { state_data: stateData };
                        } catch (e) {
                            console.error('Ошибка при парсинге состояния из sessionStorage:', e);
                            return null;
                        }
                    }
                    return null;
                }
            } catch (checkErr) {
                console.error('Ошибка при проверке таблицы:', checkErr);

                // Используем данные из sessionStorage
                const stateJson = sessionStorage.getItem('trainingState');
                if (stateJson) {
                    try {
                        const stateData = JSON.parse(stateJson);
                        return { state_data: stateData };
                    } catch (e) {
                        console.error('Ошибка при парсинге состояния из sessionStorage:', e);
                        return null;
                    }
                }
                return null;
            }

            // Получаем состояние тренировки из базы данных
            // Используем maybeSingle вместо single, чтобы избежать ошибки, если запись не найдена
            const { data, error } = await supabase
                .from('training_states')
                .select('*')
                .eq('training_id', trainingId)
                .maybeSingle();

            // Если произошла ошибка (не связанная с отсутствием записи)
            if (error && error.code !== 'PGRST116') {
                console.error('Ошибка при получении состояния тренировки:', error);

                // В случае ошибки пытаемся использовать данные из sessionStorage
                const stateJson = sessionStorage.getItem('trainingState');
                if (stateJson) {
                    try {
                        const stateData = JSON.parse(stateJson);
                        return { state_data: stateData };
                    } catch (e) {
                        console.error('Ошибка при парсинге состояния из sessionStorage:', e);
                        return null;
                    }
                }
                return null;
            }

            // Если данные найдены, возвращаем их
            if (data) {
                console.log('Получено состояние тренировки:', data);
                return data;
            }

            // Если данные не найдены, используем sessionStorage
            console.log('Состояние тренировки не найдено в базе данных, используем sessionStorage');
            const stateJson = sessionStorage.getItem('trainingState');
            if (stateJson) {
                try {
                    const stateData = JSON.parse(stateJson);
                    return { state_data: stateData };
                } catch (e) {
                    console.error('Ошибка при парсинге состояния из sessionStorage:', e);
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error getting training state:', error);

            // В случае ошибки пытаемся использовать данные из sessionStorage
            const stateJson = sessionStorage.getItem('trainingState');
            if (stateJson) {
                try {
                    const stateData = JSON.parse(stateJson);
                    return { state_data: stateData };
                } catch (e) {
                    console.error('Ошибка при парсинге состояния из sessionStorage:', e);
                    return null;
                }
            }
            return null;
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