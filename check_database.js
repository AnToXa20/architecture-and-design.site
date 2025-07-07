const mysql = require('mysql2/promise');

// Настройки базы данных
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'architecture_bureau'
};

async function checkDatabase() {
    let connection;
    
    try {
        console.log('Подключаемся к базе данных...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Подключение к БД установлено');
        
        // Проверяем существует ли таблица images
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'architecture_bureau' 
            AND TABLE_NAME = 'images'
        `);
        
        if (tables.length === 0) {
            console.log('Таблица images не существует');
            return;
        }
        
        console.log('Таблица images существует');
        
        // Получаем структуру таблицы
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'architecture_bureau' 
            AND TABLE_NAME = 'images'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('\nСтруктура таблицы images:');
        columns.forEach(col => {
            console.log(`- ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'} ${col.COLUMN_KEY ? `(${col.COLUMN_KEY})` : ''}`);
        });
        
        // Проверяем содержимое таблицы
        const [rows] = await connection.execute('SELECT * FROM images LIMIT 5');
        console.log(`\nВ таблице images ${rows.length > 0 ? `есть данные (показываем первые 5):` : 'нет данных'}`);
        
        if (rows.length > 0) {
            rows.forEach((row, index) => {
                console.log(`${index + 1}.`, row);
            });
        }
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nСоединение с БД закрыто');
        }
    }
}

checkDatabase(); 