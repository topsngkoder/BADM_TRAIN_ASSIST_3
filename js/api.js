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

            // Получаем связанных игроков
            const { data: trainingPlayers, error: tpError } = await supabase
                .from('training_players')
                .select('player_id')
                .eq('training_id', numericId);

            if (tpError) {
                console.error(`Ошибка при получении игроков для тренировки ${numericId}:`, tpError);
                return data; // Возвращаем тренировку без игроков
            }

            // Если нет связей, возвращаем тренировку без игроков
            if (!trainingPlayers || trainingPlayers.length === 0) {
                return data;
            }

            // Получаем данные игроков
            const playerIds = trainingPlayers.map(tp => tp.player_id);
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

            // Пробуем получить тренировки с игроками
            try {
                // Сначала получаем все тренировки
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
                        // Получаем связи тренировка-игрок
                        const { data: trainingPlayers, error: tpError } = await supabase
                            .from('training_players')
                            .select('player_id')
                            .eq('training_id', training.id);

                        if (tpError) {
                            console.error(`Ошибка при получении игроков для тренировки ${training.id}:`, tpError);
                            return training; // Возвращаем тренировку без игроков
                        }

                        // Если нет связей, возвращаем тренировку без игроков
                        if (!trainingPlayers || trainingPlayers.length === 0) {
                            return training;
                        }

                        // Получаем данные игроков
                        const playerIds = trainingPlayers.map(tp => tp.player_id);
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
                console.error('Ошибка при получении тренировок с игроками:', error);

                // Если не удалось получить тренировки с игроками, пробуем получить только тренировки
                const { data: trainingsOnly, error: trainingsError } = await supabase
                    .from('trainings')
                    .select('*')
                    .order('date', { ascending: false });

                if (trainingsError) {
                    console.error('Ошибка при получении только тренировок:', trainingsError);
                    throw trainingsError;
                }

                console.log('Получены только тренировки (без игроков):', trainingsOnly);
                return trainingsOnly;
            }
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

            // Сначала добавляем основные данные тренировки
            const trainingInsertData = {
                venue: trainingData.venue,
                date: trainingData.date,
                time: trainingData.time,
                court_count: parseInt(trainingData.courtCount)
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

            // Если есть игроки, добавляем их в связующую таблицу
            if (trainingData.players && trainingData.players.length > 0) {
                try {
                    // Проверяем, существует ли таблица training_players
                    const { error: tpCheckError } = await supabase
                        .from('training_players')
                        .select('id')
                        .limit(1);

                    if (tpCheckError) {
                        console.error('Ошибка при проверке таблицы training_players:', tpCheckError);
                        throw new Error('Таблица training_players не существует или недоступна. Пожалуйста, создайте таблицу в Supabase.');
                    }

                    // Преобразуем строковые ID в числовые, если необходимо
                    const playerEntries = trainingData.players.map(playerId => ({
                        training_id: parseInt(training[0].id),
                        player_id: parseInt(playerId)
                    }));

                    console.log('Добавление игроков к тренировке:', playerEntries);

                    const { error: playersError } = await supabase
                        .from('training_players')
                        .insert(playerEntries);

                    if (playersError) {
                        console.error('Ошибка при добавлении игроков к тренировке:', playersError);
                        throw playersError;
                    }

                    console.log('Игроки успешно добавлены к тренировке');
                } catch (playerError) {
                    console.error('Ошибка при добавлении игроков:', playerError);
                    // Продолжаем выполнение, даже если не удалось добавить игроков
                    // Тренировка уже создана, и мы не хотим терять эти данные
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

            // Сначала удаляем связи с игроками
            console.log(`Удаление связей с игроками для тренировки ${numericId}`);
            const { error: playersError } = await supabase
                .from('training_players')
                .delete()
                .eq('training_id', numericId);

            if (playersError) {
                console.error('Ошибка при удалении связей с игроками:', playersError);
                throw playersError;
            }

            // Затем удаляем саму тренировку
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