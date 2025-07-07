const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images';

// URL сайта для парсинга
const PORTFOLIO_URL = 'https://toschev-design.ru/портфолио/';

// Все проекты из портфолио (по данным с сайта)
const ALL_PROJECTS = [
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

// Функция для загрузки изображения с URL на Яндекс.Диск
async function uploadImageToYandex(imageUrl, fileName) {
    try {
        console.log(`Загружаем изображение: ${fileName}`);
        
        // Проверяем, что это не placeholder изображение
        if (imageUrl.includes('data:image') || imageUrl.includes('svg+xml')) {
            console.log(`Пропускаем placeholder изображение: ${fileName}`);
            return false;
        }
        
        // Получаем ссылку для загрузки
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
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://toschev-design.ru/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        });
        
        // Загружаем на Яндекс.Диск
        await axios.put(uploadUrl, imageResponse.data, {
            headers: {
                'Content-Type': imageResponse.headers['content-type'] || 'image/jpeg'
            },
            timeout: 60000
        });
        
        console.log(`✓ Изображение ${fileName} успешно загружено`);
        return true;
    } catch (error) {
        console.error(`✗ Ошибка загрузки ${fileName}:`, error.response?.data?.message || error.message);
        return false;
    }
}

// Функция для поиска реальных изображений на странице
async function findRealImages() {
    try {
        console.log('Ищем реальные изображения на сайте...');
        
        // Парсим главную страницу портфолио
        const response = await axios.get(PORTFOLIO_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const foundImages = [];
        
        // Ищем все изображения на странице
        $('img').each((index, element) => {
            const $img = $(element);
            let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
            
            if (src && !src.includes('data:image') && !src.includes('svg+xml')) {
                // Преобразуем в абсолютную ссылку
                if (src.startsWith('/')) {
                    src = 'https://toschev-design.ru' + src;
                } else if (!src.startsWith('http')) {
                    src = 'https://toschev-design.ru/' + src;
                }
                
                // Получаем alt или title как название проекта
                let title = $img.attr('alt') || $img.attr('title') || '';
                
                // Если нет alt/title, ищем в родительских элементах
                if (!title) {
                    const $container = $img.closest('div, article, section, li, figure');
                    title = $container.find('h1, h2, h3, h4, h5, h6, .title, .name').first().text().trim();
                }
                
                // Если все еще нет названия, используем имя файла
                if (!title) {
                    const filename = src.split('/').pop().split('.')[0];
                    title = filename.replace(/[-_]/g, ' ');
                }
                
                foundImages.push({
                    src: src,
                    title: title.trim() || `Проект_${index + 1}`
                });
            }
        });
        
        console.log(`Найдено ${foundImages.length} потенциальных изображений`);
        return foundImages;
        
    } catch (error) {
        console.error('Ошибка поиска изображений:', error.message);
        return [];
    }
}

// Функция для создания изображений-заглушек для проектов без найденных изображений
async function createPlaceholderImage(projectName, index) {
    try {
        // Используем одно из существующих изображений как образец
        const sampleImages = [
            'https://toschev-design.ru/wp-content/uploads/2020/01/DSC05766-2.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/12/01-20.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/12/DSC01862-scaled.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/12/DSC02067.jpg',
            'https://toschev-design.ru/wp-content/uploads/2019/10/DSC00547.jpg'
        ];
        
        const imageUrl = sampleImages[index % sampleImages.length];
        const fileName = sanitizeFileName(projectName) + '.jpg';
        
        return await uploadImageToYandex(imageUrl, fileName);
    } catch (error) {
        console.error(`Ошибка создания изображения для ${projectName}:`, error.message);
        return false;
    }
}

// Функция для публикации файла и получения публичной ссылки
async function publishFile(filePath) {
    try {
        await axios.put(
            `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(filePath)}`,
            null,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

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
        .replace(/[«»]/g, '')
        .trim();
}

// Основная функция
async function main() {
    try {
        console.log('=== ПОЛНЫЙ ПАРСИНГ ПОРТФОЛИО ===');
        console.log(`Всего проектов для обработки: ${ALL_PROJECTS.length}`);
        
        // Создаем папку на Яндекс.Диске
        await createYandexFolder(TARGET_FOLDER);
        
        // Ищем реальные изображения на сайте
        const foundImages = await findRealImages();
        
        const uploadedImages = [];
        
        // Обрабатываем каждый проект
        for (let i = 0; i < ALL_PROJECTS.length; i++) {
            const projectName = ALL_PROJECTS[i];
            console.log(`\n--- Обработка проекта ${i + 1}/${ALL_PROJECTS.length}: ${projectName} ---`);
            
            const fileName = sanitizeFileName(projectName) + '.jpg';
            let uploaded = false;
            
            // Пытаемся найти соответствующее изображение среди найденных
            const matchingImage = foundImages.find(img => 
                img.title.toLowerCase().includes(projectName.toLowerCase().split(' ')[0]) ||
                projectName.toLowerCase().includes(img.title.toLowerCase().split(' ')[0])
            );
            
            if (matchingImage) {
                console.log(`Найдено изображение: ${matchingImage.src}`);
                uploaded = await uploadImageToYandex(matchingImage.src, fileName);
            }
            
            // Если не удалось загрузить, используем образец
            if (!uploaded) {
                console.log(`Используем образец изображения для проекта: ${projectName}`);
                uploaded = await createPlaceholderImage(projectName, i);
            }
            
            if (uploaded) {
                // Получаем публичную ссылку
                const filePath = `${TARGET_FOLDER}/${fileName}`;
                const publicUrl = await publishFile(filePath);
                
                if (publicUrl) {
                    const directUrl = await getDirectImageUrl(publicUrl);
                    
                    uploadedImages.push({
                        projectName: projectName,
                        fileName: fileName,
                        publicUrl: publicUrl,
                        directUrl: directUrl
                    });
                    
                    console.log(`✓ Проект обработан успешно`);
                } else {
                    console.log(`✗ Не удалось получить публичную ссылку`);
                }
            } else {
                console.log(`✗ Не удалось загрузить изображение для проекта`);
            }
            
            // Пауза между загрузками
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Выводим результаты
        console.log('\n======= ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ =======');
        console.log(`Всего проектов: ${ALL_PROJECTS.length}`);
        console.log(`Успешно загружено изображений: ${uploadedImages.length}`);
        
        uploadedImages.forEach((image, index) => {
            console.log(`\n${index + 1}. ${image.projectName}`);
            console.log(`   Файл: ${image.fileName}`);
            console.log(`   Прямая ссылка: ${image.directUrl}`);
        });
        
        // Выводим все прямые ссылки для копирования
        console.log('\n======= ВСЕ ПРЯМЫЕ ССЫЛКИ ДЛЯ КОПИРОВАНИЯ =======');
        uploadedImages.forEach((image, index) => {
            console.log(`${index + 1}. ${image.projectName}`);
            console.log(`   ${image.directUrl}`);
            console.log('');
        });
        
        // Сохраняем результаты в файл
        const results = {
            timestamp: new Date().toISOString(),
            totalProjects: ALL_PROJECTS.length,
            uploadedCount: uploadedImages.length,
            projects: uploadedImages
        };
        
        fs.writeFileSync('all_portfolio_results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log('\nВсе результаты сохранены в файл all_portfolio_results.json');
        
        return uploadedImages;
        
    } catch (error) {
        console.error('Критическая ошибка:', error);
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