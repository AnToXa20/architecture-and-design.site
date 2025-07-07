const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images';

// URL сайта для парсинга
const PORTFOLIO_URL = 'https://toschev-design.ru/портфолио/';

// Функция для создания папки на Яндекс.Диске
async function createYandexFolder(folderPath) {
    try {
        await axios.put(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(folderPath)}`,
            null,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        console.log(`Папка ${folderPath} создана`);
    } catch (error) {
        if (error.response?.data?.error === 'PlatformResourceAlreadyExists') {
            console.log(`Папка ${folderPath} уже существует`);
        } else {
            console.error('Ошибка создания папки:', error.response?.data || error.message);
        }
    }
}

// Функция для загрузки изображения на Яндекс.Диск
async function uploadImageToYandex(imageUrl, fileName) {
    try {
        console.log(`Загружаем изображение: ${fileName}`);
        
        // Сначала получаем ссылку для загрузки
        const uploadLinkResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(`${TARGET_FOLDER}/${fileName}`)}&overwrite=true`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        
        const uploadUrl = uploadLinkResponse.data.href;
        
        // Скачиваем изображение
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // Загружаем изображение на Яндекс.Диск
        await axios.put(uploadUrl, imageResponse.data, {
            headers: {
                'Content-Type': imageResponse.headers['content-type'] || 'image/jpeg'
            }
        });
        
        console.log(`Изображение ${fileName} успешно загружено`);
        return true;
    } catch (error) {
        console.error(`Ошибка загрузки изображения ${fileName}:`, error.response?.data || error.message);
        return false;
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

// Функция для получения прямой ссылки на изображение
async function getDirectImageUrl(publicUrl) {
    try {
        const urlParts = publicUrl.split('/');
        const resourceId = urlParts[urlParts.length - 1];
        return `https://downloader.disk.yandex.ru/preview/${resourceId}?size=XL&uid=0`;
    } catch (error) {
        console.error('Ошибка получения прямой ссылки:', error);
        return publicUrl;
    }
}

// Функция для парсинга портфолио
async function parsePortfolio() {
    try {
        console.log('Начинаем парсинг портфолио...');
        
        // Получаем HTML страницы
        const response = await axios.get(PORTFOLIO_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const projects = [];
        
        // Ищем все проекты на странице
        $('.portfolio-item, .project-item, [class*="project"], [class*="portfolio"]').each((index, element) => {
            const $element = $(element);
            
            // Получаем название проекта
            let title = $element.find('h3, h2, .title, .name, [class*="title"], [class*="name"]').first().text().trim();
            if (!title) {
                title = $element.find('img').attr('alt') || $element.find('img').attr('title') || '';
            }
            
            // Получаем ссылку на изображение
            let imageUrl = $element.find('img').attr('src') || $element.find('img').attr('data-src');
            
            if (imageUrl && title) {
                // Преобразуем относительную ссылку в абсолютную
                if (imageUrl.startsWith('/')) {
                    imageUrl = 'https://toschev-design.ru' + imageUrl;
                } else if (!imageUrl.startsWith('http')) {
                    imageUrl = 'https://toschev-design.ru/' + imageUrl;
                }
                
                projects.push({
                    title: title.replace(/[<>:"/\\|?*]/g, '_'), // Убираем недопустимые символы для имени файла
                    imageUrl: imageUrl
                });
            }
        });
        
        // Если не нашли проекты через селекторы, попробуем другой подход
        if (projects.length === 0) {
            console.log('Проекты не найдены через основные селекторы, пробуем альтернативный поиск...');
            
            // Ищем все изображения и их контейнеры
            $('img').each((index, element) => {
                const $img = $(element);
                const src = $img.attr('src') || $img.attr('data-src');
                
                if (src && (src.includes('portfolio') || src.includes('project') || src.includes('.jpg') || src.includes('.png'))) {
                    const $container = $img.closest('div, article, section, li');
                    let title = $img.attr('alt') || $img.attr('title') || 
                               $container.find('h1, h2, h3, h4, h5, h6').first().text().trim() ||
                               `Project_${index + 1}`;
                    
                    let imageUrl = src;
                    if (imageUrl.startsWith('/')) {
                        imageUrl = 'https://toschev-design.ru' + imageUrl;
                    } else if (!imageUrl.startsWith('http')) {
                        imageUrl = 'https://toschev-design.ru/' + imageUrl;
                    }
                    
                    projects.push({
                        title: title.replace(/[<>:"/\\|?*]/g, '_'),
                        imageUrl: imageUrl
                    });
                }
            });
        }
        
        console.log(`Найдено проектов: ${projects.length}`);
        return projects;
        
    } catch (error) {
        console.error('Ошибка парсинга:', error.message);
        return [];
    }
}

// Основная функция
async function main() {
    try {
        console.log('Запуск скрипта парсинга портфолио...');
        
        // Создаем папку на Яндекс.Диске
        await createYandexFolder(TARGET_FOLDER);
        
        // Парсим портфолио
        const projects = await parsePortfolio();
        
        if (projects.length === 0) {
            console.log('Проекты не найдены. Проверьте URL и селекторы.');
            return;
        }
        
        const uploadedImages = [];
        
        // Загружаем каждое изображение
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            console.log(`\nОбработка проекта ${i + 1}/${projects.length}: ${project.title}`);
            
            // Определяем расширение файла
            const urlParts = project.imageUrl.split('.');
            const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
            const fileName = `${project.title}.${extension}`;
            
            // Загружаем изображение
            const uploaded = await uploadImageToYandex(project.imageUrl, fileName);
            
            if (uploaded) {
                // Получаем публичную ссылку
                const filePath = `${TARGET_FOLDER}/${fileName}`;
                const publicUrl = await publishFile(filePath);
                
                if (publicUrl) {
                    const directUrl = await getDirectImageUrl(publicUrl);
                    
                    uploadedImages.push({
                        title: project.title,
                        fileName: fileName,
                        publicUrl: publicUrl,
                        directUrl: directUrl
                    });
                }
            }
            
            // Небольшая пауза между загрузками
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Выводим результаты
        console.log('\n======= РЕЗУЛЬТАТЫ =======');
        console.log(`Успешно загружено изображений: ${uploadedImages.length}`);
        
        uploadedImages.forEach((image, index) => {
            console.log(`\n${index + 1}. Проект: ${image.title}`);
            console.log(`   Файл: ${image.fileName}`);
            console.log(`   Публичная ссылка: ${image.publicUrl}`);
            console.log(`   Прямая ссылка: ${image.directUrl}`);
        });
        
        // Выводим только прямые ссылки для удобства
        console.log('\n======= ПРЯМЫЕ ССЫЛКИ ДЛЯ КОПИРОВАНИЯ =======');
        uploadedImages.forEach((image, index) => {
            console.log(`${index + 1}. ${image.directUrl}`);
        });
        
        return uploadedImages;
        
    } catch (error) {
        console.error('Критическая ошибка:', error);
    }
}

// Запуск скрипта
if (require.main === module) {
    main()
        .then(() => {
            console.log('\nСкрипт завершен.');
        })
        .catch(error => {
            console.error('Критическая ошибка:', error);
        });
}

module.exports = { main, parsePortfolio }; 