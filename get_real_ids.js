const axios = require('axios');
const cheerio = require('cheerio');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const FOLDER_PATH = 'Architecture&design/main-slider';

// Список публичных ссылок на файлы
const publicUrls = [
    { id: 1, name: '0000_Фасад.JPG', url: 'https://yadi.sk/i/6V-6rvOraWw2fA' },
    { id: 2, name: '0006_гст.JPG', url: 'https://yadi.sk/i/dfMmUuNX4qWDpw' },
    { id: 3, name: '005_гостиная_05.jpg', url: 'https://yadi.sk/i/3FLHnDTI2t8oLA' },
    { id: 4, name: '00_Дом_КП Третья охота.jpg', url: 'https://yadi.sk/i/ufo2BgwCQuL-fQ' },
    { id: 5, name: '00_Дом_Клуб20\'71.jpg', url: 'https://yadi.sk/i/FkmJ_3SbGaa8yQ' },
    { id: 6, name: '012_гостиная.jpg', url: 'https://yadi.sk/i/C8L9llru6GGz_Q' },
    { id: 7, name: 'IMG_3956.JPG', url: 'https://yadi.sk/i/adftSvzK6lVCOw' }
];

// Функция для получения HTML страницы публичного ресурса
async function getHtmlPage(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Ошибка получения HTML для ${url}:`, error.message);
        return null;
    }
}

// Функция для получения прямой ссылки из публичной ссылки с помощью парсинга HTML
async function getDirectLinkFromHtml(publicUrl) {
    try {
        const html = await getHtmlPage(publicUrl);
        if (!html) return null;
        
        const $ = cheerio.load(html);
        
        // Ищем мета-тег с прямой ссылкой на изображение (og:image)
        const imageUrl = $('meta[property="og:image"]').attr('content');
        
        if (imageUrl) {
            return imageUrl;
        }
        
        return null;
    } catch (error) {
        console.error(`Ошибка извлечения данных из HTML для ${publicUrl}:`, error.message);
        return null;
    }
}

// Функция для получения прямой ссылки через API
async function getDirectLinkFromApi(url) {
    try {
        const shortId = url.split('/').pop();
        
        // Получаем информацию о публичном ресурсе
        const publicResourceResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(url)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        
        if (publicResourceResponse.data && publicResourceResponse.data.file) {
            // Формируем ссылку на скачивание
            const downloadResponse = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(url)}`,
                {
                    headers: {
                        'Authorization': `OAuth ${YANDEX_TOKEN}`
                    }
                }
            );
            
            if (downloadResponse.data && downloadResponse.data.href) {
                return downloadResponse.data.href;
            }
        }
        
        return null;
    } catch (error) {
        console.error(`Ошибка получения прямой ссылки через API для ${url}:`, error.response?.data || error.message);
        return null;
    }
}

// Основная функция для получения прямых ссылок на изображения
async function getDirectImageLinks() {
    console.log('Получение прямых ссылок на изображения Яндекс.Диска...');
    
    const results = [];
    
    for (const item of publicUrls) {
        console.log(`\nОбработка файла ${item.id}: ${item.name}`);
        console.log(`Публичная ссылка: ${item.url}`);
        
        // Пытаемся получить прямую ссылку через парсинг HTML
        console.log('Получение прямой ссылки через HTML...');
        const htmlDirectLink = await getDirectLinkFromHtml(item.url);
        
        if (htmlDirectLink) {
            console.log(`Найдена прямая ссылка через HTML: ${htmlDirectLink}`);
            
            // Добавляем информацию в результаты
            results.push({
                id: item.id,
                name: item.name,
                publicUrl: item.url,
                directUrl: htmlDirectLink,
                method: 'html'
            });
            continue;
        }
        
        console.log('Прямая ссылка через HTML не найдена, попытка получения через API...');
        
        // Пытаемся получить ссылку через API
        const apiDirectLink = await getDirectLinkFromApi(item.url);
        
        if (apiDirectLink) {
            console.log(`Найдена прямая ссылка через API: ${apiDirectLink}`);
            
            // Добавляем информацию в результаты
            results.push({
                id: item.id,
                name: item.name,
                publicUrl: item.url,
                directUrl: apiDirectLink,
                method: 'api'
            });
        } else {
            console.log('Не удалось получить прямую ссылку для этого файла.');
        }
    }
    
    console.log('\n======= РЕЗУЛЬТАТЫ =======');
    console.log(`Найдено ${results.length} прямых ссылок из ${publicUrls.length} файлов`);
    
    // Выводим результаты
    if (results.length > 0) {
        console.log('\n======= ПРЯМЫЕ ССЫЛКИ =======');
        results.forEach(result => {
            console.log(`\nID: ${result.id}`);
            console.log(`Название: ${result.name}`);
            console.log(`Публичная ссылка: ${result.publicUrl}`);
            console.log(`Прямая ссылка: ${result.directUrl}`);
            console.log(`Метод получения: ${result.method}`);
            console.log('---');
        });
        
        // Формируем SQL-запросы для вставки в базу данных
        console.log('\n======= SQL ЗАПРОСЫ =======');
        results.forEach(result => {
            console.log(`INSERT INTO images (id, filename, url, direct_url) VALUES (${result.id}, '${result.name}', '${result.publicUrl}', '${result.directUrl}');`);
        });
    }
    
    return results;
}

// Запускаем функцию
getDirectImageLinks()
    .then(() => {
        console.log('\nСкрипт завершен.');
    })
    .catch(error => {
        console.error('Критическая ошибка:', error);
    }); 