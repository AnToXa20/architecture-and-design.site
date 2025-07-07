const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Настройки базы данных
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'architecture_bureau'
};

// Middleware
app.use(cors());
app.use(express.json());

// API для получения данных портфолио
app.get('/api/portfolio', async (req, res) => {
    let connection;
    
    try {
        console.log('Получение данных портфолио...');
        
        // Подключаемся к базе данных
        connection = await mysql.createConnection(DB_CONFIG);
        
        // Получаем все изображения портфолио
        const [rows] = await connection.execute(`
            SELECT 
                id,
                url,
                alt_text,
                title,
                entity_type,
                entity_id,
                direct_url
            FROM images 
            ORDER BY entity_id, id
        `);
        
        // Группируем по типам для удобства
        const portfolio = {
            all: [],
            apartments: [],
            houses: [],
            offices: []
        };
        
        rows.forEach(image => {
            // Добавляем во все проекты
            portfolio.all.push(image);
            
            // Добавляем в соответствующую категорию
            if (image.entity_type === 'apartments') {
                portfolio.apartments.push(image);
            } else if (image.entity_type === 'houses') {
                portfolio.houses.push(image);
            } else if (image.entity_type === 'offices') {
                portfolio.offices.push(image);
            }
        });
        
        console.log(`Найдено изображений: ${rows.length}`);
        console.log(`Квартиры: ${portfolio.apartments.length}, Дома: ${portfolio.houses.length}, Офисы: ${portfolio.offices.length}`);
        
        // Возвращаем данные
        res.json({
            success: true,
            data: portfolio,
            total: rows.length,
            counts: {
                all: portfolio.all.length,
                apartments: portfolio.apartments.length,
                houses: portfolio.houses.length,
                offices: portfolio.offices.length
            }
        });
        
    } catch (error) {
        console.error('Ошибка получения данных портфолио:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения данных: ' + error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API для получения конкретного проекта
app.get('/api/portfolio/:id', async (req, res) => {
    let connection;
    
    try {
        const projectId = req.params.id;
        console.log(`Получение проекта с ID: ${projectId}`);
        
        // Подключаемся к базе данных
        connection = await mysql.createConnection(DB_CONFIG);
        
        // Получаем конкретный проект
        const [rows] = await connection.execute(`
            SELECT 
                id,
                url,
                alt_text,
                title,
                entity_type,
                entity_id,
                direct_url
            FROM images 
            WHERE id = ?
        `, [projectId]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Проект не найден'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
        
    } catch (error) {
        console.error('Ошибка получения проекта:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения проекта: ' + error.message
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Статические файлы
app.use(express.static('.'));

// Запуск сервера
app.listen(PORT, () => {
    console.log(`=== PORTFOLIO API СЕРВЕР ЗАПУЩЕН ===`);
    console.log(`Сервер работает на http://localhost:${PORT}`);
    console.log(`API доступно по адресу: http://localhost:${PORT}/api/portfolio`);
    console.log('Для остановки нажмите Ctrl+C');
});

// Обработка выхода
process.on('SIGINT', () => {
    console.log('\n=== СЕРВЕР ОСТАНОВЛЕН ===');
    process.exit(0);
}); 