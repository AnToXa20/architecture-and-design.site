const axios = require('axios');
const mysql = require('mysql2/promise');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images2';

// Настройки базы данных
const DB_CONFIG = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'architecture_bureau'
};

// Функция для классификации изображений
function classifyImage(fileName) {
    const name = fileName.toLowerCase();
    
    // Загородные дома (терраса)
    if (name.includes('терраса') || name.includes('новахово')) {
        return 2; // Загородные дома
    }
    
    // Офисы
    if (name.includes('офис') || name.includes('бц') || name.includes('storm') || 
        name.includes('капитал') || name.includes('путейский') || name.includes('офисные')) {
        return 3; // Офисы
    }
    
    return 1; // По умолчанию интерьеры
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
        console.log(`Получаем список файлов из папки: ${TARGET_FOLDER}...`);
        
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

// Функция для проверки, существует ли файл в БД
async function checkFileExists(connection, fileName) {
    try {
        const [rows] = await connection.execute(
            'SELECT id FROM images WHERE alt_text = ?',
            [fileName]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Ошибка проверки файла в БД:', error.message);
        return false;
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
        // Создаем title из названия файла
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
        console.log('=== ДОБАВЛЕНИЕ ИЗОБРАЖЕНИЙ ИЗ Portfolio-test-images2 ===');
        
        // Подключаемся к базе данных
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Подключение к БД установлено');
        
        // Получаем список файлов
        const files = await getYandexFiles();
        
        if (files.length === 0) {
            console.log('Файлы не найдены в указанной папке!');
            return;
        }
        
        console.log('\nНайденные файлы:');
        files.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name}`);
        });
        
        const processedImages = [];
        
        // Обрабатываем каждый файл
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\n--- Обработка файла ${i + 1}/${files.length}: ${file.name} ---`);
            
            // Проверяем, есть ли уже в БД
            const exists = await checkFileExists(connection, file.name);
            if (exists) {
                console.log(`⚠️ Файл уже существует в БД: ${file.name}`);
                continue;
            }
            
            // Получаем прямую ссылку на скачивание
            const downloadUrl = await getDownloadUrl(file.path);
            
            if (!downloadUrl) {
                console.log(`✗ Не удалось получить ссылку для ${file.name}`);
                continue;
            }
            
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
        
        // Выводим результаты
        console.log('\n======= РЕЗУЛЬТАТЫ ДОБАВЛЕНИЯ =======');
        console.log(`Всего файлов обработано: ${files.length}`);
        console.log(`Успешно добавлено в БД: ${processedImages.length}`);
        
        if (processedImages.length > 0) {
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
            
            // Выводим все добавленные изображения с URL
            console.log('\n======= ДОБАВЛЕННЫЕ ИЗОБРАЖЕНИЯ =======');
            processedImages.forEach((img, index) => {
                console.log(`\n${index + 1}. ${img.name}`);
                console.log(`   ID в БД: ${img.id}`);
                console.log(`   Тип: ${img.entityDisplayName}`);
                console.log(`   URL: ${img.url.substring(0, 100)}...`);
            });
            
            // Проверяем работоспособность URL
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
            
            console.log('\n✅ Все изображения успешно добавлены в базу данных!');
        } else {
            console.log('\n✨ Все файлы уже существуют в базе данных');
        }
        
    } catch (error) {
        console.error('Критическая ошибка:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nСоединение с БД закрыто');
        }
    }
}

// Запуск скрипта
main()
    .then(() => {
        console.log('\n=== СКРИПТ ЗАВЕРШЕН ===');
    })
    .catch(error => {
        console.error('Критическая ошибка:', error);
    }); 