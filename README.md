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
   - Создать таблицы:
     - `players` со следующими полями:
       - `id` (uuid, primary key)
       - `first_name` (text)
       - `last_name` (text)
       - `rating` (integer)
       - `photo` (text, nullable)
     - `trainings` со следующими полями:
       - `id` (uuid, primary key)
       - `venue` (text)
       - `date` (date)
       - `time` (time)
       - `court_count` (integer)
     - `training_players` (связующая таблица) со следующими полями:
       - `id` (uuid, primary key)
       - `training_id` (uuid, foreign key -> trainings.id)
       - `player_id` (uuid, foreign key -> players.id)
   - Создать хранилище (bucket) с именем `players`
   - Обновить URL и ключ API в файле `js/config.js`

## Развертывание

Приложение можно развернуть на любом статическом хостинге, например:
- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)

## Лицензия

MIT