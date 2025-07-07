const axios = require('axios');

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

// Функция для получения ссылки на скачивание файла
async function getDownloadLink(filePath) {
    try {
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/resources/download?path=${encodeURIComponent(filePath)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                }
            }
        );

        if (response.data && response.data.href) {
            return response.data.href;
        }

        return null;
    } catch (error) {
        console.error(`Ошибка получения ссылки на скачивание для ${filePath}:`, error.response?.data || error.message);
        return null;
    }
}

// Функция для проверки ссылки и получения финальной ссылки после редиректов
async function getFinalUrl(url) {
    try {
        const response = await axios.head(url, { maxRedirects: 5 });
        // Если был редирект, axios автоматически следует за ним и возвращает финальный URL
        if (response.request.res.responseUrl) {
            return response.request.res.responseUrl;
        }
        return url;
    } catch (error) {
        console.error(`Ошибка получения финальной ссылки для ${url}:`, error.message);
        return url;
    }
}

// Преобразование ссылки в формат avatars.mds.yandex.net
function convertToAvatarsUrl(url) {
    try {
        const urlObj = new URL(url);
        // Проверяем, что это ссылка Яндекс.Диска
        if (urlObj.hostname.includes('yandex') && urlObj.pathname.includes('disk')) {
            // Извлекаем идентификатор файла из URL
            const pathParts = urlObj.pathname.split('/');
            const fileId = pathParts[pathParts.length - 1];
            
            // Формируем постоянную ссылку в формате avatars.mds.yandex.net
            return `https://avatars.mds.yandex.net/get-disk-public/${fileId}/1200x800`;
        }
        return url;
    } catch (error) {
        console.error(`Ошибка преобразования ссылки ${url}:`, error.message);
        return url;
    }
}

// Основная функция
async function getDirectDownloadLinks() {
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
            
            // Публикуем файл, если он еще не опубликован
            let publicUrl = file.public_url;
            if (!publicUrl) {
                console.log(`Файл ${file.name} еще не опубликован, публикуем...`);
                try {
                    await axios.put(
                        `https://cloud-api.yandex.net/v1/disk/resources/publish?path=${encodeURIComponent(file.path)}`,
                        null,
                        {
                            headers: {
                                'Authorization': `OAuth ${YANDEX_TOKEN}`
                            }
                        }
                    );
                    
                    // Получаем обновленную информацию о файле
                    const fileInfoResponse = await axios.get(
                        `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(file.path)}`,
                        {
                            headers: {
                                'Authorization': `OAuth ${YANDEX_TOKEN}`
                            }
                        }
                    );
                    
                    publicUrl = fileInfoResponse.data.public_url;
                    console.log(`Файл ${file.name} опубликован: ${publicUrl}`);
                } catch (error) {
                    console.error(`Ошибка публикации файла ${file.name}:`, error.response?.data || error.message);
                    continue;
                }
            } else {
                console.log(`Файл ${file.name} уже опубликован: ${publicUrl}`);
            }
            
            // Получаем информацию о публичном ресурсе
            try {
                const publicResourceResponse = await axios.get(
                    `https://cloud-api.yandex.net/v1/disk/public/resources?public_key=${encodeURIComponent(publicUrl)}`,
                    {
                        headers: {
                            'Authorization': `OAuth ${YANDEX_TOKEN}`
                        }
                    }
                );
                
                if (publicResourceResponse.data && publicResourceResponse.data.file) {
                    // Извлекаем идентификатор файла из URL
                    const urlParts = publicUrl.split('/');
                    const resourceId = urlParts[urlParts.length - 1];
                    
                    // Формируем постоянную ссылку на изображение
                    const directUrl = `https://avatars.mds.yandex.net/get-disk-public/${resourceId}/1200x800`;
                    
                    console.log(`Прямая ссылка: ${directUrl}`);
                    
                    // Добавляем информацию в массив
                    imagesInfo.push({
                        id: i + 1,
                        name: file.name,
                        publicUrl: publicUrl,
                        directUrl: directUrl
                    });
                }
            } catch (error) {
                console.error(`Ошибка получения информации о публичном ресурсе ${file.name}:`, error.response?.data || error.message);
            }
        }
        
        // Выводим результаты
        console.log('\n======= РЕЗУЛЬТАТЫ =======');
        console.log('Найдено изображений с прямыми ссылками:', imagesInfo.length);
        
        if (imagesInfo.length > 0) {
            // Выводим информацию о каждом изображении
            imagesInfo.forEach(image => {
                console.log(`\nID: ${image.id}`);
                console.log(`Название: ${image.name}`);
                console.log(`Публичная ссылка: ${image.publicUrl}`);
                console.log(`Direct URL: ${image.directUrl}`);
                console.log('---');
            });
            
            // Выводим только прямые ссылки для копирования в формате SQL
            console.log('\n======= ПРЯМЫЕ ССЫЛКИ ДЛЯ КОПИРОВАНИЯ В SQL =======');
            imagesInfo.forEach(image => {
                console.log(`INSERT INTO images (id, filename, url, direct_url) VALUES (${image.id}, '${image.name}', '${image.publicUrl}', '${image.directUrl}');`);
            });
        }
        
        return imagesInfo;
    } catch (error) {
        console.error('Ошибка при получении изображений:', error.message);
    }
}

// Запускаем функцию
getDirectDownloadLinks()
    .then(() => {
        console.log('\nСкрипт завершен.');
    })
    .catch(error => {
        console.error('Критическая ошибка:', error);
    }); 