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

// Функция для получения прямой ссылки на изображение из HTML страницы
async function getImageUrlFromHtml(publicUrl) {
    try {
        const response = await axios.get(publicUrl);
        const $ = cheerio.load(response.data);
        
        // Ищем мета-тег с прямой ссылкой на изображение
        const imageUrl = $('meta[property="og:image"]').attr('content');
        
        if (imageUrl) {
            return imageUrl;
        } else {
            console.error(`Не удалось найти прямую ссылку для ${publicUrl}`);
            return null;
        }
    } catch (error) {
        console.error(`Ошибка получения HTML страницы для ${publicUrl}:`, error.message);
        return null;
    }
}

// Основная функция
async function getDirectImageLinks() {
    try {
        console.log('Получаем список файлов из директории', FOLDER_PATH);
        
        // Получаем список файлов
        const files = await getFilesList();
        console.log(`Найдено ${files.length} файлов`);
        
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
                publicUrl = await publishFile(file.path);
                if (!publicUrl) {
                    console.error(`Не удалось получить публичную ссылку для ${file.name}`);
                    continue;
                }
                console.log(`Получена публичная ссылка для ${file.name}: ${publicUrl}`);
            }
            
            // Получаем прямую ссылку на изображение из HTML
            const directImageUrl = await getImageUrlFromHtml(publicUrl);
            
            if (directImageUrl) {
                console.log(`Прямая ссылка: ${directImageUrl}`);
                
                // Добавляем информацию в массив
                imagesInfo.push({
                    name: file.name,
                    publicUrl: publicUrl,
                    directUrl: directImageUrl
                });
            } else {
                console.error(`Не удалось получить прямую ссылку для файла ${file.name}`);
            }
        }
        
        // Выводим результаты
        console.log('\n======= РЕЗУЛЬТАТЫ =======');
        console.log('Найдено изображений с прямыми ссылками:', imagesInfo.length);
        
        if (imagesInfo.length > 0) {
            // Выводим информацию о каждом изображении
            imagesInfo.forEach((image, index) => {
                console.log(`\nИзображение ${index + 1}: ${image.name}`);
                console.log(`Публичная ссылка: ${image.publicUrl}`);
                console.log(`Прямая ссылка: ${image.directUrl}`);
            });
            
            // Выводим только прямые ссылки для копирования
            console.log('\n======= ПРЯМЫЕ ССЫЛКИ ДЛЯ КОПИРОВАНИЯ =======');
            imagesInfo.forEach((image, index) => {
                console.log(`${index + 1}. ${image.directUrl}`);
            });
        }
        
        return imagesInfo;
    } catch (error) {
        console.error('Ошибка при получении изображений:', error.message);
    }
}

// Запускаем функцию
getDirectImageLinks()
    .then(() => {
        console.log('\nСкрипт завершен.');
    })
    .catch(error => {
        console.error('Критическая ошибка:', error);
    }); 