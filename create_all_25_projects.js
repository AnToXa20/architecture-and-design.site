const axios = require('axios');
const fs = require('fs');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const TARGET_FOLDER = 'Architecture&design/Portfolio-test-images';

// Все 25 проектов из портфолио
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

// Функция для получения списка уже загруженных файлов
async function getExistingFiles() {
    try {
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(TARGET_FOLDER)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        if (response.data && response.data._embedded && response.data._embedded.items) {
            return response.data._embedded.items.filter(item => item.type === 'file');
        }
        return [];
    } catch (error) {
        console.error('Ошибка получения списка файлов:', error.response?.data || error.message);
        return [];
    }
}

// Функция для копирования файла
async function copyFile(sourceFile, newFileName) {
    try {
        console.log(`Копируем файл: ${sourceFile.name} -> ${newFileName}`);
        
        // Получаем ссылку для скачивания исходного файла
        const downloadResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(sourceFile.path)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        
        const downloadUrl = downloadResponse.data.href;
        
        // Получаем ссылку для загрузки нового файла
        const uploadLinkResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(`${TARGET_FOLDER}/${newFileName}`)}&overwrite=true`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );
        
        const uploadUrl = uploadLinkResponse.data.href;
        
        // Скачиваем исходный файл
        const fileResponse = await axios.get(downloadUrl, {
            responseType: 'stream',
            timeout: 30000
        });
        
        // Загружаем новый файл
        await axios.put(uploadUrl, fileResponse.data, {
            headers: {
                'Content-Type': 'image/jpeg'
            },
            timeout: 60000
        });
        
        console.log(`✓ Файл скопирован: ${newFileName}`);
        return true;
        
    } catch (error) {
        console.error(`✗ Ошибка копирования ${newFileName}:`, error.response?.data?.message || error.message);
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
        console.log('=== СОЗДАНИЕ ВСЕХ 25 ПРОЕКТОВ ПОРТФОЛИО ===');
        console.log(`Всего проектов для создания: ${ALL_PROJECTS.length}`);
        
        // Получаем список уже загруженных файлов
        const existingFiles = await getExistingFiles();
        console.log(`Найдено уже загруженных файлов: ${existingFiles.length}`);
        
        if (existingFiles.length === 0) {
            console.log('Нет исходных файлов для копирования!');
            return;
        }
        
        // Выводим список существующих файлов
        console.log('\nСуществующие файлы:');
        existingFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name}`);
        });
        
        const uploadedImages = [];
        
        // Обрабатываем каждый проект
        for (let i = 0; i < ALL_PROJECTS.length; i++) {
            const projectName = ALL_PROJECTS[i];
            console.log(`\n--- Создание проекта ${i + 1}/${ALL_PROJECTS.length}: ${projectName} ---`);
            
            const fileName = sanitizeFileName(projectName) + '.jpg';
            
            // Проверяем, существует ли уже файл с таким именем
            const existingFile = existingFiles.find(file => file.name === fileName);
            
            let fileCreated = false;
            
            if (existingFile) {
                console.log(`Файл ${fileName} уже существует, используем его`);
                fileCreated = true;
            } else {
                // Выбираем исходный файл для копирования циклично
                const sourceFile = existingFiles[i % existingFiles.length];
                fileCreated = await copyFile(sourceFile, fileName);
            }
            
            if (fileCreated) {
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
                    
                    console.log(`✓ Проект создан успешно`);
                } else {
                    console.log(`✗ Не удалось получить публичную ссылку`);
                }
            } else {
                console.log(`✗ Не удалось создать файл для проекта`);
            }
            
            // Небольшая пауза между операциями
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Выводим результаты
        console.log('\n======= ФИНАЛЬНЫЕ РЕЗУЛЬТАТЫ =======');
        console.log(`Всего проектов: ${ALL_PROJECTS.length}`);
        console.log(`Успешно создано файлов: ${uploadedImages.length}`);
        
        uploadedImages.forEach((image, index) => {
            console.log(`\n${index + 1}. ${image.projectName}`);
            console.log(`   Файл: ${image.fileName}`);
            console.log(`   Прямая ссылка: ${image.directUrl}`);
        });
        
        // Выводим все прямые ссылки для копирования
        console.log('\n======= ВСЕ 25 ПРЯМЫХ ССЫЛОК НА ИЗОБРАЖЕНИЯ ПРОЕКТОВ =======');
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
        
        fs.writeFileSync('complete_portfolio_results.json', JSON.stringify(results, null, 2), 'utf8');
        console.log('\nВсе результаты сохранены в файл complete_portfolio_results.json');
        
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