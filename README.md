# Приложение для тренировок по бадминтону

Веб-приложение для управления игроками и тренировками по бадминтону. Разработано с использованием современных веб-технологий и Supabase в качестве бэкенда.

## Функциональность

- Управление списком игроков (добавление, редактирование, удаление)
- Сортировка игроков по фамилии или рейтингу
- Загрузка и отображение фотографий игроков
- Визуальная индикация рейтинга игроков с помощью цветовой кодировки
- Управление тренировками (добавление, просмотр)
- Выбор игроков для участия в тренировке
- Адаптивный дизайн для мобильных и десктопных устройств
- Поддержка свайпов для навигации между вкладками на мобильных устройствах

## Технологии

- HTML5, CSS3, JavaScript (ES6+)
- Supabase для хранения данных и файлов
- Feather Icons для иконок
- Модульная архитектура JavaScript

## Структура проекта

```
/
├── index.html          # Главная HTML-страница
├── styles.css          # Стили приложения
├── js/                 # JavaScript модули
│   ├── main.js         # Главный модуль приложения
│   ├── api.js          # Сервисный слой для работы с Supabase API
│   ├── config.js       # Конфигурация приложения
│   ├── players.js      # Модуль для работы с игроками
│   ├── trainings.js    # Модуль для работы с тренировками
│   └── ui.js           # Модуль для работы с UI элементами
└── README.md           # Документация проекта
```

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/topsngkoder/BADM_TRAIN_ASSIST_3.git
cd BADM_TRAIN_ASSIST_3
```

2. Откройте `index.html` в браузере или используйте локальный сервер:
```bash
# Если у вас установлен Python 3:
python -m http.server

# Если у вас установлен Node.js:
npx serve
```

3. Для работы с Supabase необходимо:
   - Создать проект в [Supabase](https://supabase.io/)
   - Создать таблицы через SQL Editor в Supabase:

   ```sql
   -- Проверяем тип столбца id в таблице players
   DO $$
   DECLARE
     player_id_type TEXT;
   BEGIN
     SELECT data_type INTO player_id_type
     FROM information_schema.columns
     WHERE table_name = 'players' AND column_name = 'id';

     IF player_id_type = 'integer' THEN
       RAISE NOTICE 'Таблица players использует тип INTEGER для id';
     ELSIF player_id_type = 'uuid' THEN
       RAISE NOTICE 'Таблица players использует тип UUID для id';
     ELSE
       RAISE NOTICE 'Таблица players использует тип % для id', player_id_type;
     END IF;
   EXCEPTION
     WHEN OTHERS THEN
       RAISE NOTICE 'Таблица players не существует или произошла ошибка при проверке';
   END $$;

   -- Создание таблицы игроков (если она еще не существует)
   CREATE TABLE IF NOT EXISTS players (
     id SERIAL PRIMARY KEY,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     rating INTEGER NOT NULL,
     photo TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Создание таблицы тренировок (если она еще не существует)
   CREATE TABLE IF NOT EXISTS trainings (
     id SERIAL PRIMARY KEY,
     venue TEXT NOT NULL,
     date DATE NOT NULL,
     time TIME NOT NULL,
     court_count INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Создание связующей таблицы между тренировками и игроками (если она еще не существует)
   CREATE TABLE IF NOT EXISTS training_players (
     id SERIAL PRIMARY KEY,
     training_id INTEGER REFERENCES trainings(id) ON DELETE CASCADE,
     player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(training_id, player_id)
   );

   -- Создание индексов для оптимизации запросов (если они еще не существуют)
   DO $$
   BEGIN
     -- Проверяем, существует ли индекс idx_players_rating
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_players_rating') THEN
       CREATE INDEX idx_players_rating ON players(rating DESC);
     END IF;

     -- Проверяем, существует ли индекс idx_players_last_name
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_players_last_name') THEN
       CREATE INDEX idx_players_last_name ON players(last_name);
     END IF;

     -- Проверяем, существует ли индекс idx_trainings_date
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_trainings_date') THEN
       CREATE INDEX idx_trainings_date ON trainings(date DESC);
     END IF;

     -- Проверяем, существует ли индекс idx_training_players_training_id
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_training_players_training_id') THEN
       CREATE INDEX idx_training_players_training_id ON training_players(training_id);
     END IF;

     -- Проверяем, существует ли индекс idx_training_players_player_id
     IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_training_players_player_id') THEN
       CREATE INDEX idx_training_players_player_id ON training_players(player_id);
     END IF;
   END $$;
   ```

   - Создать хранилище (bucket) с именем `players` в разделе Storage
   - Настроить политики доступа для хранилища:
     - Разрешить чтение для всех
     - Разрешить запись для аутентифицированных пользователей
   - Обновить URL и ключ API в файле `js/config.js` (найдите их в разделе Project Settings > API)

## Развертывание

Приложение можно развернуть на любом статическом хостинге, например:
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)

## Лицензия

MIT