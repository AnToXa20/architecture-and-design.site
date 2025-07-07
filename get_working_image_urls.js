/**
 * Скрипт для получения рабочих URL-ссылок на изображения из директории Яндекс.Диска
 * 
 * Этот скрипт:
 * 1. Получает список файлов из директории Architecture&design/main-slider
 * 2. Для каждого файла получает публичную ссылку (если еще не опубликован, публикует)
 * 3. Получает прямую ссылку на изображение через мета-теги HTML страницы
 * 4. Проверяет, что ссылки действительно работают
 * 5. Формирует SQL-запросы для обновления базы данных
 */

const axios = require('axios');
const cheerio = require('cheerio');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const FOLDER_PATH = 'Architecture&design/main-slider';

// Функция для получения списка файлов в директории
async function getFilesList() {
    try {
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(FOLDER_PATH)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        if (response.data && response.data._embedded && response.data._embedded.items) {
            // Фильтруем только файлы (не папки)
            return response.data._embedded.items.filter(item => item.type === 'file');
        }

        return [];
    } catch (error) {
        console.error('Ошибка получения списка файлов:', error.response?.data || error.message);
        return [];
    }
}

// Функция для публикации файла и получения публичной ссылки
async function publishFile(filePath) {
    try {
        // Публикуем файл
        await axios.put(
            `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
            null,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        // Получаем информацию о файле, включая публичную ссылку
        const fileInfoResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        return fileInfoResponse.data.public_url;
    } catch (error) {
        if (error.response?.data?.error === 'PlatformResourceAlreadyExists') {
            // Если файл уже опубликован, получаем его текущую публичную ссылку
            const fileInfoResponse = await axios.get(
                `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(filePath)}`,
                {
                    headers: {
                        'Authorization': `OAuth ${YANDEX_TOKEN}`
                    }
                }
            );
            return fileInfoResponse.data.public_url;
        }
        
        console.error('Ошибка публикации файла:', error.response?.data || error.message);
        return null;
    }
}

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

// Функция для проверки доступности ссылки
async function checkLink(id, url) {
    try {
        const response = await axios.head(url, { 
            timeout: 10000,
            validateStatus: (status) => status < 400,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const contentType = response.headers['content-type'] || '';
        const isImage = contentType.startsWith('image/');
        
        return {
            status: response.status,
            contentType: contentType,
            isValid: isImage
        };
    } catch (error) {
        console.error(`Ошибка проверки ссылки ${url}:`, error.message);
        return {
            status: error.response?.status || 0,
            contentType: null,
            isValid: false
        };
    }
}

// Основная функция
async function getWorkingImageUrls() {
    try {
        console.log('Получение рабочих ссылок на изображения из Яндекс.Диска...\n');
        
        // Получаем список файлов
        const files = await getFilesList();
        console.log(`Найдено ${files.length} файлов в директории ${FOLDER_PATH}`);
        
        if (files.length === 0) {
            console.log('Файлы не найдены. Проверьте путь к папке.');
            return;
        }
        
        // Массив для хранения информации об изображениях
        const imagesInfo = [];
        
        // Обрабатываем каждый файл
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log(`\nОбработка файла ${i + 1}/${files.length}: ${file.name}`);
            
            // Получаем публичную ссылку на файл
            let publicUrl;
            if (file.public_url) {
                console.log(`Файл ${file.name} уже опубликован: ${file.public_url}`);
                publicUrl = file.public_url;
            } else {
                console.log(`Публикуем файл ${file.name}...`);
                publicUrl = await publishFile(file.path);
                if (!publicUrl) {
                    console.error(`Не удалось получить публичную ссылку для ${file.name}`);
                    continue;
                }
                console.log(`Файл опубликован: ${publicUrl}`);
            }
            
            // Получаем прямую ссылку на изображение
            console.log(`Получаем прямую ссылку для ${file.name}...`);
            const directUrl = await getDirectLinkFromHtml(publicUrl);
            
            if (!directUrl) {
                console.error(`Не удалось получить прямую ссылку для ${file.name}`);
                continue;
            }
            
            console.log(`Получена прямая ссылка: ${directUrl}`);
            
            // Проверяем, что ссылка работает
            console.log(`Проверяем работоспособность ссылки...`);
            const linkCheck = await checkLink(i + 1, directUrl);
            
            if (linkCheck.isValid) {
                console.log(`✅ Ссылка действительна. Тип содержимого: ${linkCheck.contentType}`);
                
                // Добавляем информацию в массив
                imagesInfo.push({
                    id: i + 1,
                    name: file.name,
                    publicUrl: publicUrl,
                    directUrl: directUrl
                });
            } else {
                console.error(`❌ Ссылка недействительна. Статус: ${linkCheck.status}`);
            }
        }
        
        // Выводим итоговый результат
        console.log('\n======= ИТОГОВЫЙ РЕЗУЛЬТАТ =======');
        console.log(`Получено ${imagesInfo.length} рабочих ссылок из ${files.length} файлов`);
        
        if (imagesInfo.length > 0) {
            // Выводим список рабочих ссылок
            console.log('\n======= РАБОЧИЕ ССЫЛКИ =======');
            imagesInfo.forEach(image => {
                console.log(`\nID: ${image.id}`);
                console.log(`Название: ${image.name}`);
                console.log(`Публичная ссылка: ${image.publicUrl}`);
                console.log(`Прямая ссылка: ${image.directUrl}`);
                console.log('---');
            });
            
            // Формируем SQL-запросы для вставки/обновления в базе данных
            console.log('\n======= SQL ЗАПРОСЫ =======');
            console.log('-- Запросы INSERT для новой таблицы:');
            imagesInfo.forEach(image => {
                console.log(`INSERT INTO images (id, filename, url, direct_url) VALUES (${image.id}, '${image.name}', '${image.publicUrl}', '${image.directUrl}');`);
            });
            
            console.log('\n-- Запросы UPDATE для существующей таблицы:');
            imagesInfo.forEach(image => {
                console.log(`UPDATE images SET direct_url = '${image.directUrl}' WHERE id = ${image.id};`);
            });
        }
        
        return imagesInfo;
    } catch (error) {
        console.error('Критическая ошибка:', error);
    }
}

// Запускаем функцию
getWorkingImageUrls()
    .then(() => {
        console.log('\nСкрипт завершен успешно.');
    })
    .catch(error => {
        console.error('Критическая ошибка выполнения:', error);
    }); 