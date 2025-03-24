// Конфигурация приложения
export const config = {
    // Supabase конфигурация
    supabase: {
        url: 'https://nthnntlbqwpxnpobbqzl.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50aG5udGxicXdweG5wb2JicXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0Nzg2NDgsImV4cCI6MjA1ODA1NDY0OH0.KxUhGDwN__ZuRyOHMpL7OQtNIx-Q_Epe29ym5-IhLOA'
    },
    
    // Настройки рейтинга
    ratingThresholds: {
        blue: 300,
        green: 450,
        yellow: 600,
        orange: 800
    },
    
    // Настройки UI
    ui: {
        messageDisplayTime: 3000, // время отображения сообщений в мс
        swipeThreshold: 100 // минимальное расстояние для свайпа
    }
};