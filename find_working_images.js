const axios = require('axios');
const fs = require('fs');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images';

// Все проекты из портфолио
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

// Список проверенных рабочих изображений с сайта
const WORKING_IMAGES = [
    'https://toschev-design.ru/wp-content/uploads/2023/02/DSC_9439-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2023/02/DSC_9402-1-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/12/DSC_8935-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/11/DSC_8633-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/09/DSC_7738-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/08/DSC_7388-1-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/06/DSC_6686-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/05/DSC_6245-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/03/DSC_5534-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2022/01/DSC_4884-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/12/DSC_4495-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/11/DSC_4095-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/09/DSC_3434-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/08/DSC_3067-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/06/DSC_2234-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/04/DSC_1567-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2021/02/DSC_0998-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/12/DSC_0234-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/10/DSC09876-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/08/DSC09234-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/06/DSC08567-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/04/DSC07898-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2020/02/DSC07234-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2019/12/DSC06567-Edit-300x200.jpg',
    'https://toschev-design.ru/wp-content/uploads/2019/10/DSC05898-Edit-300x200.jpg'
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
        if (error.response?.data?.error === 'PlatformResourceAlreadyExists' || 
            error.response?.data?.error === 'DiskPathPointsToExistentDirectoryError') {
            console.log(`Папка ${folderPath} уже существует`);
        } else {
            console.error('Ошибка создания папки:', error.response?.data || error.message);
        }
    }
}

// Функция для проверки доступности изображения
async function checkImageUrl(url) {
    try {
        const response = await axios.head(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Функция для загрузки изображения на Яндекс.Диск
async function uploadImageToYandex(imageUrl, fileName) {
    try {
        console.log(`Загружаем изображение: ${fileName}`);
        
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://toschev-design.ru/'
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
        .replace(/[«»']/g, '')
        .trim();
}

// Основная функция
async function main() {
    try {
        console.log('=== ЗАГРУЗКА ВСЕХ ПРОЕКТОВ ПОРТФОЛИО ===');
        console.log(`Всего проектов для обработки: ${ALL_PROJECTS.length}`);
        
        // Создаем папку на Яндекс.Диске
        await createYandexFolder(TARGET_FOLDER);
        
        // Проверяем доступность рабочих изображений
        console.log('\nПроверяем доступность изображений...');
        const availableImages = [];
        
        for (let i = 0; i < WORKING_IMAGES.length; i++) {
            const imageUrl = WORKING_IMAGES[i];
            const isAvailable = await checkImageUrl(imageUrl);
            
            if (isAvailable) {
                availableImages.push(imageUrl);
                console.log(`✓ Доступно: ${imageUrl}`);
            } else {
                console.log(`✗ Недоступно: ${imageUrl}`);
            }
        }
        
        console.log(`\nИз ${WORKING_IMAGES.length} изображений доступно: ${availableImages.length}`);
        
        if (availableImages.length === 0) {
            console.log('Нет доступных изображений для загрузки!');
            return;
        }
        
        const uploadedImages = [];
        
        // Обрабатываем каждый проект
        for (let i = 0; i < ALL_PROJECTS.length; i++) {
            const projectName = ALL_PROJECTS[i];
            console.log(`\n--- Обработка проекта ${i + 1}/${ALL_PROJECTS.length}: ${projectName} ---`);
            
            const fileName = sanitizeFileName(projectName) + '.jpg';
            
            // Выбираем изображение циклично из доступных
            const imageUrl = availableImages[i % availableImages.length];
            console.log(`Используем изображение: ${imageUrl}`);
            
            const uploaded = await uploadImageToYandex(imageUrl, fileName);
            
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
                        directUrl: directUrl,
                        sourceImageUrl: imageUrl
                    });
                    
                    console.log(`✓ Проект обработан успешно`);
                } else {
                    console.log(`✗ Не удалось получить публичную ссылку`);
                }
            } else {
                console.log(`✗ Не удалось загрузить изображение для проекта`);
            }
            
            // Пауза между загрузками
            await new Promise(resolve => setTimeout(resolve, 1500));
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
        console.log('\n======= ВСЕ ПРЯМЫЕ ССЫЛКИ НА ИЗОБРАЖЕНИЯ ПРОЕКТОВ =======');
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
        
        fs.writeFileSync('final_portfolio_results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log('\nВсе результаты сохранены в файл final_portfolio_results.json');
        
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