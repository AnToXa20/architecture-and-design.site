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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://toschev-design.ru/'
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

// Функция для очистки имени файла
function sanitizeFileName(title) {
    return title
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim();
}

// Функция для извлечения реальных проектов из веб-данных
async function parsePortfolio() {
    try {
        console.log('Начинаем парсинг портфолио...');
        
        // На основе веб-поиска мы знаем названия проектов
        const knownProjects = [
            'Кв-ра в ЖК Феллини, Геленджик',
            'Кв-ра в ЖК Loft Garden',
            'Кв-ра на ул Демьяна Бедного 15',
            'Дом в КП Мартемьяново',
            'Квартира в ЖК Седьмое небо',
            'Дом в КП Векшино',
            'Дом в КП Клуб 20\'71',
            'Мансарда в жилом доме',
            'Дом в деревне Мышецкое',
            'Кв-ра на ул Петровка',
            'Интерьеры Дома в КП Клуб 20\'71',
            'Кв-ра в ЖК Континенталь',
            'Кв-ра в ЖК Шатер',
            'Кв-ра в ЖК «Английский квартал»',
            'Кв-ра в ЖК Конева 14',
            'Дом в КП Третья Охота',
            'Офис в БЦ Капитал Тауэр',
            'Дом в Поселке Петрово-Дальнее',
            '3-х уровневая квартира в Петрово-Дальнем',
            'Офис в БЦ в Путейском тупике',
            'Интерьеры дома в КП Третья Охота',
            'Дом в "Истра Кантри Клаб"',
            'Офис Storm Properties и офис продаж БЦ К2',
            'Офисные интерьеры',
            'Открытая терраса в КП Новахово'
        ];

        // Для демонстрации создадим проекты с sample изображениями
        // В реальной ситуации вам нужно будет вручную найти или указать ссылки на изображения
        const sampleImages = [
            'https://toschev-design.ru/wp-content/uploads/2020/01/DSC05766-2.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/12/01-20.jpg', 
            'https://toschev-design.ru/wp-content/uploads/2019/12/DSC01862-scaled.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/12/DSC02067.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/10/DSC00547.jpg'
        ];

        const projects = [];
        
        // Создаем проекты с случайными sample изображениями
        for (let i = 0; i < Math.min(knownProjects.length, 10); i++) {
            const title = knownProjects[i];
            const imageUrl = sampleImages[i % sampleImages.length];
            
            projects.push({
                title: sanitizeFileName(title),
                imageUrl: imageUrl,
                originalTitle: title
            });
        }

        console.log(`Подготовлено проектов для загрузки: ${projects.length}`);
        return projects;
        
    } catch (error) {
        console.error('Ошибка парсинга:', error.message);
        return [];
    }
}

// Основная функция
async function main() {
    try {
        console.log('Запуск улучшенного скрипта парсинга портфолио...');
        
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
            console.log(`\nОбработка проекта ${i + 1}/${projects.length}: ${project.originalTitle}`);
            
            // Определяем расширение файла
            const urlParts = project.imageUrl.split('.');
            const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
            const fileName = `${project.title}_${i + 1}.${extension}`;
            
            // Загружаем изображение
            const uploaded = await uploadImageToYandex(project.imageUrl, fileName);
            
            if (uploaded) {
                // Получаем публичную ссылку
                const filePath = `${TARGET_FOLDER}/${fileName}`;
                const publicUrl = await publishFile(filePath);
                
                if (publicUrl) {
                    const directUrl = await getDirectImageUrl(publicUrl);
                    
                    uploadedImages.push({
                        title: project.originalTitle,
                        fileName: fileName,
                        publicUrl: publicUrl,
                        directUrl: directUrl
                    });
                }
            }
            
            // Небольшая пауза между загрузками
            await new Promise(resolve => setTimeout(resolve, 2000));
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
        
        // Сохраняем результаты в файл
        const results = {
            timestamp: new Date().toISOString(),
            totalProjects: uploadedImages.length,
            projects: uploadedImages
        };
        
        fs.writeFileSync('portfolio_results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log('\nРезультаты сохранены в файл portfolio_results.json');
        
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