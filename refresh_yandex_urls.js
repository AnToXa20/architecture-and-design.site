const axios = require('axios');
const db = require('./db');

const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';
const BASE_PATH = 'Architecture&design';

// Функция для получения актуальной прямой ссылки
async function getActualDownloadUrl(publicUrl) {
    try {
        console.log('Получаю новую ссылку для:', publicUrl.substring(0, 50) + '...');
        
        // Используем API загрузки с публичным ключом
        const downloadResponse = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(publicUrl)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                },
                timeout: 15000
            }
        );
        
        if (downloadResponse.data && downloadResponse.data.href) {
            console.log('✅ Получена новая прямая ссылка');
            return downloadResponse.data.href;
        }
        
        throw new Error('API не вернул прямую ссылку');
        
    } catch (error) {
        console.log('❌ Ошибка получения новой ссылки:', error.message);
        return null;
    }
}

// Функция для проверки и обновления URL в БД
async function refreshExpiredUrls() {
    try {
        console.log('🔄 ОБНОВЛЕНИЕ ИСТЕКШИХ URL-ССЫЛОК ЯНДЕКС.ДИСКА');
        console.log('='.repeat(60));
        
        // Подключаемся к БД
        const isConnected = await db.testConnection();
        if (!isConnected) {
            console.log('❌ Нет подключения к базе данных');
            return;
        }
        console.log('✅ Подключение к БД установлено');
        
        // Получаем все изображения из БД
        console.log('\n📡 Получение данных из БД...');
        const images = await db.query('SELECT * FROM images ORDER BY id');
        console.log(`📊 Найдено изображений: ${images.length}`);
        
        let updatedCount = 0;
        let errorCount = 0;
        
        // Проверяем и обновляем каждое изображение
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            console.log(`\n${i + 1}/${images.length} - ID: ${image.id} - ${image.title || image.alt_text}`);
            
            if (!image.url) {
                console.log('   ⚠️ URL отсутствует, пропускаем');
                continue;
            }
            
            // Проверяем текущий URL
            try {
                const currentCheck = await axios.head(image.url, { 
                    timeout: 8000,
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    }
                });
                
                if (currentCheck.status >= 200 && currentCheck.status < 300) {
                    console.log('   ✅ URL работает, обновление не требуется');
                    continue;
                }
                
                if (currentCheck.status === 410) {
                    console.log('   🔴 URL истек (410), требуется обновление');
                } else {
                    console.log(`   ⚠️ URL вернул статус ${currentCheck.status}, пробуем обновить`);
                }
                
            } catch (error) {
                console.log('   🔴 URL недоступен, требуется обновление');
            }
            
            // Извлекаем публичный ключ из URL для получения новой ссылки
            // Для изображений портфолио используем другой подход
            console.log('   🔄 Попытка обновления URL...');
            
            // Попробуем найти файл на Яндекс.Диске по имени
            const fileName = image.alt_text || image.title || `image_${image.id}`;
            
            try {
                // Ищем файл в разных папках
                const searchPaths = [
                    `${BASE_PATH}/Kvartiry`,
                    `${BASE_PATH}/Doma`,
                    `${BASE_PATH}/Ofisy`,
                    `${BASE_PATH}/articles`,
                    `${BASE_PATH}/Uslugi`
                ];
                
                let newUrl = null;
                
                for (const searchPath of searchPaths) {
                    try {
                        // Получаем список файлов в папке
                        const folderResponse = await axios.get(
                            `https://cloud-api.yandex.net/v1/disk/resources?path=${encodeURIComponent(searchPath)}&limit=100`,
                            {
                                headers: {
                                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                                },
                                timeout: 10000
                            }
                        );
                        
                        // Ищем файл по имени (приблизительное совпадение)
                        const files = folderResponse.data._embedded?.items || [];
                        const foundFile = files.find(file => 
                            file.type === 'file' && 
                            (file.name === fileName || 
                             file.name.includes(fileName.replace(/\.[^/.]+$/, "")) ||
                             fileName.includes(file.name.replace(/\.[^/.]+$/, "")))
                        );
                        
                        if (foundFile && foundFile.public_url) {
                            // Получаем новую прямую ссылку
                            newUrl = await getActualDownloadUrl(foundFile.public_url);
                            if (newUrl) {
                                console.log(`   ✅ Файл найден в папке: ${searchPath}`);
                                break;
                            }
                        }
                    } catch (searchError) {
                        // Папка может не существовать, продолжаем поиск
                        continue;
                    }
                }
                
                if (newUrl) {
                    // Обновляем URL в БД
                    await db.query(
                        'UPDATE images SET url = ?, direct_url = ? WHERE id = ?',
                        [newUrl, newUrl, image.id]
                    );
                    
                    console.log('   ✅ URL успешно обновлен в БД');
                    updatedCount++;
                } else {
                    console.log('   ❌ Не удалось найти файл для обновления');
                    errorCount++;
                }
                
            } catch (updateError) {
                console.log('   ❌ Ошибка обновления:', updateError.message);
                errorCount++;
            }
            
            // Небольшая пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n📊 РЕЗУЛЬТАТЫ ОБНОВЛЕНИЯ:');
        console.log(`✅ Успешно обновлено: ${updatedCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        console.log(`⚠️ Без изменений: ${images.length - updatedCount - errorCount}`);
        
        if (updatedCount > 0) {
            console.log('\n🎉 Обновление завершено! Проверьте страницы:');
            console.log('   - http://localhost:3001/portfolio.html');
            console.log('   - http://localhost:3001/articles.html');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    }
}

refreshExpiredUrls(); 