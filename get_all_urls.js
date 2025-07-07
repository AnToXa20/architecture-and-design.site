const mysql = require('mysql2/promise');

// Настройки базы данных
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'architecture_bureau'
};

async function getAllUrls() {
    let connection;
    
    try {
        console.log('=== ПОЛНЫЕ URL-ССЫЛКИ ИЗ БАЗЫ ДАННЫХ ===');
        
        // Подключаемся к базе данных
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Подключение к БД установлено');
        
        // Получаем все изображения портфолио
        const [rows] = await connection.execute(`
            SELECT id, alt_text, title, entity_type, entity_id, url 
            FROM images 
            WHERE entity_type IN ('apartments', 'houses', 'offices') 
            ORDER BY entity_id, alt_text
        `);
        
        if (rows.length === 0) {
            console.log('Изображения портфолио не найдены в базе данных');
            return;
        }
        
        console.log(`\nВсего найдено изображений портфолио: ${rows.length}\n`);
        
        // Группируем по типам
        const byType = rows.reduce((acc, row) => {
            let typeName;
            switch(row.entity_id) {
                case 1: typeName = 'Интерьеры (квартиры)'; break;
                case 2: typeName = 'Загородные дома'; break;
                case 3: typeName = 'Офисы'; break;
                default: typeName = 'Другое';
            }
            
            if (!acc[typeName]) {
                acc[typeName] = [];
            }
            acc[typeName].push(row);
            return acc;
        }, {});
        
        // Выводим изображения по типам
        Object.keys(byType).forEach(typeName => {
            console.log(`\n======= ${typeName.toUpperCase()} (${byType[typeName].length} изображений) =======`);
            
            byType[typeName].forEach((image, index) => {
                console.log(`\n${index + 1}. ${image.alt_text}`);
                console.log(`   ID в БД: ${image.id}`);
                console.log(`   Название: ${image.title}`);
                console.log(`   URL: ${image.url}`);
            });
        });
        
        // Выводим все URL одним списком для копирования
        console.log('\n\n======= ВСЕ URL ДЛЯ КОПИРОВАНИЯ =======');
        rows.forEach((image, index) => {
            console.log(`\n${index + 1}. ${image.alt_text}`);
            console.log(`${image.url}`);
        });
        
        // Статистика
        console.log('\n\n======= СТАТИСТИКА =======');
        Object.keys(byType).forEach(typeName => {
            console.log(`${typeName}: ${byType[typeName].length} изображений`);
        });
        console.log(`Всего: ${rows.length} изображений`);
        
    } catch (error) {
        console.error('Ошибка:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nСоединение с БД закрыто');
        }
    }
}

getAllUrls(); 