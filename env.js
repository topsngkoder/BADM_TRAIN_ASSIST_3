// Этот скрипт загружает переменные окружения из Vercel в window
// Он должен быть загружен перед основным скриптом приложения

(function() {
  // Проверяем, находимся ли мы в среде Vercel
  if (typeof process !== 'undefined' && process.env) {
    // Устанавливаем переменные окружения в window
    window.SUPABASE_URL = process.env.SUPABASE_URL;
    window.SUPABASE_KEY = process.env.SUPABASE_KEY;
  }
})();