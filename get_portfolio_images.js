const axios = require('axios');

// Токен для доступа к API Яндекс.Диска
const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const FOLDER_PATH = 'Architecture&design/Portfolio-test-images';

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

// Функция для получения прямой ссылки на изображение из публичной ссылки
async function getDirectImageUrl(publicUrl) {
    try {
        // Получаем ключ ресурса из URL
        const urlParts = publicUrl.split('/');
        const resourceId = urlParts[urlParts.length - 1];
        
        // Формируем URL для предпросмотра изображения
        return `https://downloader.disk.yandex.ru/preview/${resourceId}?size=XL&uid=0`;
    } catch (error) {
        console.error('Ошибка получения прямой ссылки:', error.response?.data || error.message);
        // Возвращаем исходную публичную ссылку в случае ошибки
        return publicUrl;
    }
}

// Сопоставление названий проектов с их описаниями
const projectNames = {
    'Кв-ра в ЖК Феллини, Геленджик.jpg': 'Кв-ра в ЖК Феллини, Геленджик',
    'Квартира в ЖК Седьмое небо.jpg': 'Квартира в ЖК Седьмое небо', 
    'Мансарда в жилом доме.jpg': 'Мансарда в жилом доме',
    'Офис в БЦ в Путейском тупике.jpg': 'Офис в БЦ в Путейском тупике',
    'Офис Storm Properties и офис продаж БЦ К2.jpeg': 'Офис Storm Properties и офис продаж БЦ К2',
    'Открытая терраса в КП Новахово.jpg': 'Открытая терраса в КП Новахово'
};

// Основная функция
async function getPortfolioImages() {
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
            console.log(`Обработка файла ${i + 1}/${files.length}: ${file.name}`);
            
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
            
            // Получаем прямую ссылку на изображение
            const directImageUrl = await getDirectImageUrl(publicUrl);
            console.log(`Прямая ссылка на изображение: ${directImageUrl}`);
            
            // Получаем название проекта
            const projectName = projectNames[file.name] || file.name.replace(/\.[^.]+$/, '');
            
            // Добавляем информацию в массив
            imagesInfo.push({
                projectName: projectName,
                fileName: file.name,
                publicUrl: publicUrl,
                directUrl: directImageUrl
            });
        }
        
        // Выводим результаты
        console.log('\n======= РЕЗУЛЬТАТЫ =======');
        console.log('Найдено изображений портфолио:', imagesInfo.length);
        
        imagesInfo.forEach((image, index) => {
            console.log(`\n${index + 1}. Проект: ${image.projectName}`);
            console.log(`   Файл: ${image.fileName}`);
            console.log(`   Публичная ссылка: ${image.publicUrl}`);
            console.log(`   Прямая ссылка: ${image.directUrl}`);
        });
        
        // Выводим только прямые ссылки для копирования
        console.log('\n======= ПРЯМЫЕ ССЫЛКИ НА ИЗОБРАЖЕНИЯ ПОРТФОЛИО =======');
        imagesInfo.forEach((image, index) => {
            console.log(`${index + 1}. ${image.projectName}`);
            console.log(`   ${image.directUrl}`);
            console.log('');
        });
        
        return imagesInfo;
    } catch (error) {
        console.error('Ошибка при получении изображений:', error.message);
    }
}

// Запускаем функцию
getPortfolioImages()
    .then(() => {
        console.log('\nСкрипт завершен.');
    })
    .catch(error => {
        console.error('Критическая ошибка:', error);
    }); 