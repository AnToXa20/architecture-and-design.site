const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images';

// Настройки базы данных
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'architecture_bureau'
};

// Функция для классификации изображений по названию
function classifyImage(fileName) {
    const name = fileName.toLowerCase();
    
    // Интерьеры (квартиры)
    if (name.includes('кв-ра') || name.includes('квартир') || name.includes('интерьер') || 
        name.includes('жк') || name.includes('английский') || name.includes('феллини') ||
        name.includes('седьмое') || name.includes('континенталь') || name.includes('шатер') ||
        name.includes('конева') || name.includes('петровка') || name.includes('демьяна') ||
        name.includes('loft') || name.includes('уровневая')) {
        return 1; // Интерьеры
    }
    
    // Офисы
    if (name.includes('офис') || name.includes('бц') || name.includes('storm') || 
        name.includes('капитал') || name.includes('путейский') || name.includes('офисные')) {
        return 3; // Офисы
    }
    
    // Загородные дома
    if (name.includes('дом') || name.includes('кп') || name.includes('терраса') || 
        name.includes('мансарда') || name.includes('мартемьяново') || name.includes('векшино') ||
        name.includes('клуб') || name.includes('мышецкое') || name.includes('третья') ||
        name.includes('петрово') || name.includes('истра') || name.includes('новахово')) {
        return 2; // Загородные дома
    }
    
    // По умолчанию - Интерьеры
    return 1;
}

// Функция для получения типа в текстовом виде
function getEntityTypeName(entityId) {
    switch(entityId) {
        case 1: return 'apartments';
        case 2: return 'houses';
        case 3: return 'offices';
        default: return 'apartments';
    }
}

// Функция для получения названия типа по-русски
function getEntityTypeDisplayName(entityId) {
    switch(entityId) {
        case 1: return 'Интерьеры (квартиры)';
        case 2: return 'Загородные дома';
        case 3: return 'Офисы';
        default: return 'Интерьеры (квартиры)';
    }
}

// Функция для получения списка файлов из Яндекс.Диска
async function getYandexFiles() {
    try {
        console.log('Получаем список файлов из Яндекс.Диска...');
        
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(TARGET_FOLDER)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        if (response.data && response.data._embedded && response.data._embedded.items) {
            const files = response.data._embedded.items.filter(item => item.type === 'file');
            console.log(`Найдено файлов: ${files.length}`);
            return files;
        }
        
        return [];
    } catch (error) {
        console.error('Ошибка получения списка файлов:', error.response?.data || error.message);
        return [];
    }
}

// Функция для получения прямой ссылки на скачивание файла
async function getDownloadUrl(filePath) {
    try {
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        
        return response.data.href;
    } catch (error) {
        console.error(`Ошибка получения ссылки для скачивания ${filePath}:`, error.response?.data || error.message);
        return null;
    }
}

// Функция для сохранения изображения в базу данных
async function saveImageToDatabase(connection, fileName, url, entityId, entityType) {
    try {
        // Проверяем, существует ли уже такое изображение по alt_text или url
        const [existing] = await connection.execute(
            'SELECT id FROM images WHERE alt_text = ? OR url = ?',
            [fileName, url]
        );
        
        if (existing.length > 0) {
            console.log(`Изображение ${fileName} уже существует в базе данных`);
            return existing[0].id;
        }
        
        // Создаем title из названия файла (убираем расширение и заменяем символы)
        const title = fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
        
        // Вставляем новое изображение
        const [result] = await connection.execute(
            'INSERT INTO images (url, alt_text, title, entity_type, entity_id, direct_url) VALUES (?, ?, ?, ?, ?, ?)',
            [url, fileName, title, entityType, entityId, url]
        );
        
        console.log(`✓ Сохранено в БД: ${fileName} (ID: ${result.insertId})`);
        return result.insertId;
    } catch (error) {
        console.error(`Ошибка сохранения ${fileName} в БД:`, error.message);
        return null;
    }
}

// Основная функция
async function main() {
    let connection;
    
    try {
        console.log('=== СОХРАНЕНИЕ ИЗОБРАЖЕНИЙ ПОРТФОЛИО В БАЗУ ДАННЫХ ===');
        
        // Подключаемся к базе данных
        console.log('Подключаемся к базе данных...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Подключение к БД установлено');
        
        // Получаем список файлов из Яндекс.Диска
        const files = await getYandexFiles();
        
        if (files.length === 0) {
            console.log('Файлы не найдены!');
            return;
        }
        
        const processedImages = [];
        
        // Обрабатываем каждый файл
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\n--- Обработка файла ${i + 1}/${files.length}: ${file.name} ---`);
            
            // Получаем прямую ссылку на скачивание
            const downloadUrl = await getDownloadUrl(file.path);
            
            if (!downloadUrl) {
                console.log(`✗ Не удалось получить ссылку для ${file.name}`);
                continue;
            }
            
            console.log(`Ссылка для скачивания получена`);
            
            // Классифицируем изображение
            const entityId = classifyImage(file.name);
            const entityType = getEntityTypeName(entityId);
            const entityDisplayName = getEntityTypeDisplayName(entityId);
            
            console.log(`Тип изображения: ${entityDisplayName} (${entityType}, ID: ${entityId})`);
            
            // Сохраняем в базу данных
            const dbId = await saveImageToDatabase(connection, file.name, downloadUrl, entityId, entityType);
            
            if (dbId) {
                processedImages.push({
                    id: dbId,
                    name: file.name,
                    url: downloadUrl,
                    entityId: entityId,
                    entityType: entityType,
                    entityDisplayName: entityDisplayName
                });
            }
            
            // Небольшая пауза
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Выводим статистику
        console.log('\n======= СТАТИСТИКА СОХРАНЕНИЯ =======');
        console.log(`Всего файлов обработано: ${files.length}`);
        console.log(`Успешно сохранено в БД: ${processedImages.length}`);
        
        // Группируем по типам
        const byType = processedImages.reduce((acc, img) => {
            if (!acc[img.entityDisplayName]) {
                acc[img.entityDisplayName] = [];
            }
            acc[img.entityDisplayName].push(img);
            return acc;
        }, {});
        
        console.log('\nРаспределение по типам:');
        Object.keys(byType).forEach(type => {
            console.log(`${type}: ${byType[type].length} изображений`);
        });
        
        // Выводим все сохраненные URL для проверки
        console.log('\n======= ВСЕ СОХРАНЕННЫЕ URL =======');
        processedImages.forEach((img, index) => {
            console.log(`\n${index + 1}. ${img.name}`);
            console.log(`   Тип: ${img.entityDisplayName}`);
            console.log(`   URL: ${img.url.substring(0, 100)}...`);
        });
        
        // Проверяем несколько URL на рабочесть
        console.log('\n======= ПРОВЕРКА URL НА РАБОТОСПОСОБНОСТЬ =======');
        for (let i = 0; i < Math.min(3, processedImages.length); i++) {
            const img = processedImages[i];
            try {
                const response = await axios.head(img.url, { timeout: 10000 });
                console.log(`✓ ${img.name}: URL работает (статус ${response.status})`);
            } catch (error) {
                console.log(`✗ ${img.name}: URL не работает (${error.response?.status || error.message})`);
            }
        }
        
        // Сохраняем результаты в файл
        const results = {
            timestamp: new Date().toISOString(),
            totalFiles: files.length,
            savedCount: processedImages.length,
            statistics: byType,
            images: processedImages
        };
        
        fs.writeFileSync('database_save_results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log('\nРезультаты сохранены в файл database_save_results.json');
        
        return processedImages;
        
    } catch (error) {
        console.error('Критическая ошибка:', error);
    } finally {
        // Закрываем соединение с БД
        if (connection) {
            await connection.end();
            console.log('\nСоединение с БД закрыто');
        }
    }
}

// Запуск скрипта
if (require.main === module) {
    main()
        .then(() => {
            console.log('\n=== СКРИПТ ЗАВЕРШЕН ===');
        })
        .catch(error => {
            console.error('Критическая ошибка:', error);
        });
}

module.exports = { main }; 