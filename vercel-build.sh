#!/bin/bash

# Заменяем плейсхолдеры в config.js на реальные значения переменных окружения
sed -i "s|{{SUPABASE_URL}}|$SUPABASE_URL|g" config.js
sed -i "s|{{SUPABASE_KEY}}|$SUPABASE_KEY|g" config.js

echo "Конфигурация обновлена с переменными окружения"