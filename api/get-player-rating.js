// Серверная функция для получения рейтинга игрока с сайта Badminton4u
// Проверяем, доступен ли node-fetch
let fetch;
try {
    fetch = require('node-fetch');
} catch (error) {
    // Если node-fetch не установлен, используем глобальный fetch
    fetch = global.fetch;
}

/**
 * Извлекает ID игрока из URL
 * @param {string} url - URL профиля игрока на Badminton4u
 * @returns {string|null} - ID игрока или null, если не удалось извлечь
 */
function extractPlayerIdFromUrl(url) {
    if (!url) return null;

    try {
        // Пытаемся извлечь ID из URL вида https://badminton4u.ru/players/18879
        const match = url.match(/\/players\/(\d+)/);
        return match ? match[1] : null;
    } catch (error) {
        console.error('[API] Ошибка при извлечении ID игрока:', error);
        return null;
    }
}

/**
 * Получает рейтинг игрока в парном разряде с сайта Badminton4u
 * @param {object} req - HTTP запрос
 * @param {object} res - HTTP ответ
 */
module.exports = async (req, res) => {
    // Устанавливаем заголовки CORS для разрешения запросов с любого домена
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обрабатываем preflight запросы (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Проверяем метод запроса
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Метод не разрешен' });
    }

    try {
        // Получаем URL профиля игрока из query параметра
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'Не указан URL профиля игрока' });
        }

        console.log(`[API] Получен запрос на получение рейтинга для URL: ${url}`);

        // Извлекаем ID игрока из URL
        const playerId = extractPlayerIdFromUrl(url);

        if (!playerId) {
            return res.status(400).json({ error: 'Не удалось извлечь ID игрока из URL' });
        }

        console.log(`[API] Извлечен ID игрока: ${playerId}`);

        // Формируем URL для запроса к Badminton4u
        const playerUrl = `https://badminton4u.ru/players/${playerId}`;

        console.log(`[API] Выполняем запрос к: ${playerUrl}`);

        try {
            // Выполняем запрос к сайту Badminton4u
            const response = await fetch(playerUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.log(`[API] Ошибка при получении страницы: ${response.status} ${response.statusText}`);
                return res.status(404).json({
                    error: 'Не удалось получить страницу игрока',
                    status: response.status,
                    statusText: response.statusText
                });
            }

            // Получаем HTML страницы
            const html = await response.text();
            console.log(`[API] Получен HTML, длина: ${html.length} символов`);

            if (!html || html.length < 100) {
                console.log('[API] Получен пустой или слишком короткий HTML');
                return res.status(404).json({
                    error: 'Получен пустой или некорректный HTML'
                });
            }

            // Выводим часть HTML для отладки
            console.log('[API] Фрагмент HTML для отладки:', html.substring(0, 500) + '...');

            // Новый алгоритм парсинга рейтинга
            console.log('[API] Используем новый алгоритм парсинга рейтинга...');

            // Метод 1: Ищем элемент с data-tab="rat_d" (double rating)
            console.log('[API] Метод 1: Ищем элемент с data-tab="rat_d"...');
            const doubleRatingTabMatch = html.match(/<li[^>]*data-tab="rat_d"[^>]*>[\s\S]*?<b>double<\/b>\s*<dfn>(?:<dfn>)?(\d+)(?:<\/dfn>)?<\/dfn>[\s\S]*?<\/li>/i);
            
            if (doubleRatingTabMatch && doubleRatingTabMatch[1]) {
                const rating = parseInt(doubleRatingTabMatch[1]);
                console.log(`[API] Рейтинг в парном разряде найден в элементе с data-tab="rat_d": ${rating}`);
                return res.status(200).json({ rating });
            }
            
            // Метод 2: Ищем в заголовке h3 (формат: nickname / rating)
            console.log('[API] Метод 2: Ищем в заголовке h3...');
            const headerRatingMatch = html.match(/<h3>[^<]*<dfn>\d+<\/dfn>\s*\/\s*(?:<dfn><\/dfn>)?<dfn>(\d+)<\/dfn><\/h3>/i);
            
            if (headerRatingMatch && headerRatingMatch[1]) {
                const rating = parseInt(headerRatingMatch[1]);
                console.log(`[API] Рейтинг в парном разряде найден в заголовке h3: ${rating}`);
                return res.status(200).json({ rating });
            }
            
            // Метод 3: Ищем в последних результатах (последний рейтинг в конце строки)
            console.log('[API] Метод 3: Ищем в последних результатах...');
            const lastResultMatch = html.match(/\d+ мин\.\s*(\d{3})\s*$/m);
            
            if (lastResultMatch && lastResultMatch[1]) {
                const rating = parseInt(lastResultMatch[1]);
                console.log(`[API] Рейтинг найден в последних результатах: ${rating}`);
                return res.status(200).json({ rating });
            }
            
            // Метод 4: Ищем в общей статистике
            console.log('[API] Метод 4: Ищем в общей статистике...');
            const statsMatch = html.match(/общая статистика[\s\S]*?Место в рейтинге:[\s\S]*?Сыграно турниров:/i);
            
            if (statsMatch) {
                // Ищем любые три цифры рядом, это может быть рейтинг
                const ratingInStatsMatch = statsMatch[0].match(/(\d{3})/);
                
                if (ratingInStatsMatch && ratingInStatsMatch[1]) {
                    const rating = parseInt(ratingInStatsMatch[1]);
                    console.log(`[API] Рейтинг найден в общей статистике: ${rating}`);
                    return res.status(200).json({ rating });
                }
            }
            
            // Если ничего не нашли, возвращаем ошибку
            console.log('[API] Не удалось найти рейтинг игрока ни одним из методов');
            
            return res.status(404).json({ 
                error: 'Не удалось найти рейтинг игрока на странице'
            });

        } catch (fetchError) {
            console.error('[API] Ошибка при запросе к Badminton4u:', fetchError);
            return res.status(500).json({
                error: 'Ошибка при запросе к сайту Badminton4u',
                message: fetchError.message
            });
        }

    } catch (error) {
        console.error('[API] Критическая ошибка при получении рейтинга:', error);
        return res.status(500).json({
            error: 'Критическая ошибка при получении рейтинга',
            message: error.message
        });
    }
};