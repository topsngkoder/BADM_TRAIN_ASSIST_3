/**
 * Получает рейтинг игрока с сайта Badminton4u через серверный прокси
 * @param {string} url - URL профиля игрока на Badminton4u
 * @returns {Promise<number>} - Рейтинг игрока в парном разряде
 */
export async function getPlayerRatingFromBadminton4u(url) {
    if (!url) {
        console.error('❌ URL профиля игрока не указан');
        throw new Error('URL профиля игрока не указан');
    }

    console.log('🔍 Получаем рейтинг игрока с сайта Badminton4u...');
    console.log('🔗 URL профиля игрока:', url);

    try {
        console.time('proxyFetch');
        
        // Для локальной разработки можно использовать относительный путь
        const proxyUrl = `/api/get-player-rating?url=${encodeURIComponent(url)}`;
        console.log('🔗 URL прокси:', proxyUrl);

        // Выполняем запрос к серверному прокси
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            try {
                // Пытаемся получить JSON с ошибкой
                const errorData = await response.json();
                console.error('❌ Ошибка от серверного прокси:', errorData);
                throw new Error(errorData.error || `Ошибка от сервера: ${response.status} ${response.statusText}`);
            } catch (jsonError) {
                // Если не удалось получить JSON, получаем текст ошибки
                const errorText = await response.text();
                console.error('❌ Ошибка от серверного прокси (не JSON):', errorText.substring(0, 200));
                throw new Error(`Ошибка от сервера: ${response.status} ${response.statusText}`);
            }
        }
        
        // Получаем данные от серверного прокси
        try {
            const data = await response.json();
            
            if (!data.rating) {
                console.error('❌ Серверный прокси не вернул рейтинг:', data);
                throw new Error('Серверный прокси не вернул рейтинг');
            }
            
            const rating = parseInt(data.rating);
            console.log('✅ Рейтинг успешно получен через серверный прокси:', rating);
            
            console.timeEnd('proxyFetch');
            return rating;
        } catch (jsonError) {
            console.timeEnd('proxyFetch');
            console.error('❌ Ошибка при парсинге JSON от серверного прокси:', jsonError);
            throw new Error('Ошибка при парсинге ответа от серверного прокси');
        }

    } catch (error) {
        console.timeEnd('proxyFetch');
        console.error('❌ Ошибка при получении рейтинга через серверный прокси:', error);
        throw error;
    }
}

/**
 * Получает рейтинг игрока в парном разряде с сайта Badminton4u
 * @param {string} url - URL профиля игрока на Badminton4u
 * @returns {Promise<number>} - Рейтинг игрока в парном разряде
 */
export async function getPlayerDoubleRating(url) {
    if (!url) {
        console.error('❌ URL профиля игрока не указан');
        throw new Error('URL профиля игрока не указан');
    }

    console.log('🔍 Получаем рейтинг игрока с сайта Badminton4u...');
    console.log('🔗 URL профиля игрока:', url);

    try {
        // Используем CORS-прокси для обхода ограничений CORS
        const corsProxy = 'https://corsproxy.io/?';
        const targetUrl = encodeURIComponent(url);
        const proxyUrl = `${corsProxy}${targetUrl}`;

        console.log('🔗 URL с CORS-прокси:', proxyUrl);

        // Выполняем запрос к сайту через CORS-прокси
        const response = await fetch(proxyUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`❌ Ошибка при получении страницы: ${response.status} ${response.statusText}`);
            throw new Error(`Не удалось получить страницу игрока: ${response.status} ${response.statusText}`);
        }

        // Получаем HTML страницы
        const html = await response.text();
        console.log(`✅ Получен HTML, длина: ${html.length} символов`);

        if (!html || html.length < 100) {
            console.error('❌ Получен пустой или слишком короткий HTML');
            throw new Error('Получен пустой или некорректный HTML');
        }

        // Выводим часть HTML для отладки
        console.log('🔍 Фрагмент HTML для отладки:', html.substring(0, 500) + '...');

        // Парсим рейтинг из HTML
        let rating = null;

        // Метод 1: Ищем элемент с data-tab="rat_d" (double rating)
        console.log('🔍 Метод 1: Ищем элемент с data-tab="rat_d"...');
        const doubleRatingTabMatch = html.match(/<li[^>]*data-tab="rat_d"[^>]*>[\s\S]*?<b>double<\/b>\s*<dfn>(?:<dfn>)?(\d+)(?:<\/dfn>)?<\/dfn>[\s\S]*?<\/li>/i);

        if (doubleRatingTabMatch && doubleRatingTabMatch[1]) {
            rating = parseInt(doubleRatingTabMatch[1]);
            console.log(`✅ Рейтинг в парном разряде найден в элементе с data-tab="rat_d": ${rating}`);
            return rating;
        }

        // Метод 2: Ищем в заголовке h3 (формат: nickname / rating)
        console.log('🔍 Метод 2: Ищем в заголовке h3...');
        const headerRatingMatch = html.match(/<h3>[^<]*<dfn>\d+<\/dfn>\s*\/\s*(?:<dfn><\/dfn>)?<dfn>(\d+)<\/dfn><\/h3>/i);

        if (headerRatingMatch && headerRatingMatch[1]) {
            rating = parseInt(headerRatingMatch[1]);
            console.log(`✅ Рейтинг в парном разряде найден в заголовке h3: ${rating}`);
            return rating;
        }

        // Метод 3: Ищем в последних результатах (последний рейтинг в конце строки)
        console.log('🔍 Метод 3: Ищем в последних результатах...');
        const lastResultMatch = html.match(/\d+ мин\.\s*(\d{3})\s*$/m);

        if (lastResultMatch && lastResultMatch[1]) {
            rating = parseInt(lastResultMatch[1]);
            console.log(`✅ Рейтинг найден в последних результатах: ${rating}`);
            return rating;
        }

        // Метод 4: Ищем в общей статистике
        console.log('🔍 Метод 4: Ищем в общей статистике...');
        const statsMatch = html.match(/общая статистика[\s\S]*?Место в рейтинге:[\s\S]*?Сыграно турниров:/i);

        if (statsMatch) {
            // Ищем любые три цифры рядом, это может быть рейтинг
            const ratingInStatsMatch = statsMatch[0].match(/(\d{3})/);

            if (ratingInStatsMatch && ratingInStatsMatch[1]) {
                rating = parseInt(ratingInStatsMatch[1]);
                console.log(`✅ Рейтинг найден в общей статистике: ${rating}`);
                return rating;
            }
        }

        // Метод 5: Ищем любые три цифры подряд в HTML, которые могут быть рейтингом
        console.log('🔍 Метод 5: Ищем любые три цифры подряд в HTML...');
        const anyRatingMatch = html.match(/(\d{3})/);

        if (anyRatingMatch && anyRatingMatch[1]) {
            rating = parseInt(anyRatingMatch[1]);
            console.log(`⚠️ Найдены три цифры подряд, возможно это рейтинг: ${rating}`);
            return rating;
        }

        // Если ничего не нашли, возвращаем ошибку
        console.error('❌ Не удалось найти рейтинг игрока ни одним из методов');
        throw new Error('Не удалось найти рейтинг игрока на странице');

    } catch (error) {
        console.error('❌ Ошибка при получении рейтинга с Badminton4u:', error);
        throw error;
    }
}