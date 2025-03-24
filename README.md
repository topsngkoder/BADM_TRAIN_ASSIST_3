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
   -- Создание таблицы игроков
   CREATE TABLE players (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     rating INTEGER NOT NULL,
     photo TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Создание таблицы тренировок
   CREATE TABLE trainings (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     venue TEXT NOT NULL,
     date DATE NOT NULL,
     time TIME NOT NULL,
     court_count INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Создание связующей таблицы между тренировками и игроками
   CREATE TABLE training_players (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     training_id UUID REFERENCES trainings(id) ON DELETE CASCADE,
     player_id UUID REFERENCES players(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(training_id, player_id)
   );

   -- Создание индексов для оптимизации запросов
   CREATE INDEX idx_players_rating ON players(rating DESC);
   CREATE INDEX idx_players_last_name ON players(last_name);
   CREATE INDEX idx_trainings_date ON trainings(date DESC);
   CREATE INDEX idx_training_players_training_id ON training_players(training_id);
   CREATE INDEX idx_training_players_player_id ON training_players(player_id);
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