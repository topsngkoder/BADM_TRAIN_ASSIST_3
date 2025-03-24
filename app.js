// Инициализация Supabase
// Получаем URL и ключ из конфигурации
const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = window.ENV?.SUPABASE_KEY || 'your-supabase-anon-key';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM элементы
const playersList = document.getElementById('players-list');
const addPlayerBtn = document.getElementById('add-player-btn');
const playerModal = document.getElementById('player-modal');
const closeModal = document.querySelector('.close-modal');
const playerForm = document.getElementById('player-form');
const modalTitle = document.getElementById('modal-title');
const searchInput = document.getElementById('search-player');

// Текущий редактируемый игрок
let currentPlayerId = null;

// Загрузка игроков при загрузке страницы
document.addEventListener('DOMContentLoaded', loadPlayers);

// Обработчики событий
addPlayerBtn.addEventListener('click', () => openModal());
closeModal.addEventListener('click', () => closeModalWindow());
playerForm.addEventListener('submit', handlePlayerSubmit);
searchInput.addEventListener('input', handleSearch);

// Функция загрузки игроков из Supabase
async function loadPlayers() {
    playersList.innerHTML = '<div class="loading">Загрузка списка игроков...</div>';
    
    try {
        // Получаем данные из таблицы players
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        displayPlayers(data);
    } catch (error) {
        console.error('Ошибка при загрузке игроков:', error);
        playersList.innerHTML = '<div class="error">Ошибка при загрузке списка игроков. Пожалуйста, попробуйте позже.</div>';
    }
}

// Функция отображения игроков
function displayPlayers(players) {
    if (players.length === 0) {
        playersList.innerHTML = '<div class="no-data">Игроки не найдены</div>';
        return;
    }
    
    playersList.innerHTML = '';
    
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.className = 'player-card';
        playerCard.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-level ${player.level}">${getLevelName(player.level)}</div>
            <div class="player-contact">
                ${player.phone ? `<div>📱 ${player.phone}</div>` : ''}
                ${player.email ? `<div>✉️ ${player.email}</div>` : ''}
            </div>
            ${player.notes ? `<div class="player-notes">${player.notes}</div>` : ''}
            <div class="player-actions">
                <button class="edit-btn" data-id="${player.id}">Редактировать</button>
                <button class="delete-btn" data-id="${player.id}">Удалить</button>
            </div>
        `;
        
        playersList.appendChild(playerCard);
        
        // Добавляем обработчики для кнопок
        playerCard.querySelector('.edit-btn').addEventListener('click', () => editPlayer(player.id));
        playerCard.querySelector('.delete-btn').addEventListener('click', () => deletePlayer(player.id));
    });
}

// Функция получения названия уровня
function getLevelName(level) {
    const levels = {
        'beginner': 'Начинающий',
        'intermediate': 'Средний',
        'advanced': 'Продвинутый',
        'pro': 'Профессионал'
    };
    
    return levels[level] || level;
}

// Функция открытия модального окна
function openModal(playerId = null) {
    modalTitle.textContent = playerId ? 'Редактировать игрока' : 'Добавить игрока';
    currentPlayerId = playerId;
    
    // Сбрасываем форму
    playerForm.reset();
    
    if (playerId) {
        // Загружаем данные игрока для редактирования
        loadPlayerData(playerId);
    }
    
    playerModal.style.display = 'block';
}

// Функция закрытия модального окна
function closeModalWindow() {
    playerModal.style.display = 'none';
    currentPlayerId = null;
}

// Функция загрузки данных игрока для редактирования
async function loadPlayerData(playerId) {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('id', playerId)
            .single();
        
        if (error) throw error;
        
        // Заполняем форму данными
        document.getElementById('player-name').value = data.name || '';
        document.getElementById('player-level').value = data.level || 'beginner';
        document.getElementById('player-phone').value = data.phone || '';
        document.getElementById('player-email').value = data.email || '';
        document.getElementById('player-notes').value = data.notes || '';
    } catch (error) {
        console.error('Ошибка при загрузке данных игрока:', error);
        alert('Не удалось загрузить данные игрока');
        closeModalWindow();
    }
}

// Обработчик отправки формы
async function handlePlayerSubmit(e) {
    e.preventDefault();
    
    const playerData = {
        name: document.getElementById('player-name').value,
        level: document.getElementById('player-level').value,
        phone: document.getElementById('player-phone').value,
        email: document.getElementById('player-email').value,
        notes: document.getElementById('player-notes').value
    };
    
    try {
        let result;
        
        if (currentPlayerId) {
            // Обновляем существующего игрока
            result = await supabase
                .from('players')
                .update(playerData)
                .eq('id', currentPlayerId);
        } else {
            // Добавляем нового игрока
            result = await supabase
                .from('players')
                .insert([playerData]);
        }
        
        if (result.error) throw result.error;
        
        closeModalWindow();
        loadPlayers(); // Перезагружаем список игроков
    } catch (error) {
        console.error('Ошибка при сохранении игрока:', error);
        alert('Не удалось сохранить данные игрока');
    }
}

// Функция редактирования игрока
function editPlayer(playerId) {
    openModal(playerId);
}

// Функция удаления игрока
async function deletePlayer(playerId) {
    if (!confirm('Вы уверены, что хотите удалить этого игрока?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', playerId);
        
        if (error) throw error;
        
        loadPlayers(); // Перезагружаем список игроков
    } catch (error) {
        console.error('Ошибка при удалении игрока:', error);
        alert('Не удалось удалить игрока');
    }
}

// Функция поиска игроков
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    
    // Получаем все карточки игроков
    const playerCards = document.querySelectorAll('.player-card');
    
    playerCards.forEach(card => {
        const playerName = card.querySelector('.player-name').textContent.toLowerCase();
        
        // Показываем или скрываем карточку в зависимости от поискового запроса
        if (playerName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Закрытие модального окна при клике вне его содержимого
window.addEventListener('click', (e) => {
    if (e.target === playerModal) {
        closeModalWindow();
    }
});