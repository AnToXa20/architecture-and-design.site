const axios = require('axios');
const db = require('./db');

const YANDEX_TOKEN = 'y0__xCiw9GsARjA8zcg_drjmRPYVRdg8smUUH0pJWclVDOPZc2Erg';

// Функция для извлечения публичного ключа из старого URL
function extractPublicKeyFromUrl(url) {
    try {
        // Пытаемся найти публичный ключ в разных форматах URL
        const patterns = [
            /filename=([^&]+)/,
            /public_key=([^&]+)/,
            /\/([a-zA-Z0-9%+/=]+)\?/,
            /yadi\.sk\/d\/([^/\?]+)/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return decodeURIComponent(match[1]);
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// Функция для получения новой ссылки через API
async function getNewDownloadUrl(publicKey) {
    try {
        const response = await axios.get(
            `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent('https://yadi.sk/d/' + publicKey)}`,
            {
                headers: {
                    'Authorization': `OAuth ${YANDEX_TOKEN}`
                },
                timeout: 10000
            }
        );
        
        if (response.data && response.data.href) {
            return response.data.href;
        }
        
        return null;
    } catch (error) {
        console.log('   ❌ API ошибка:', error.message);
        return null;
    }
}

async function simpleUrlFix() {
    try {
        console.log('🔧 ПРОСТОЕ ИСПРАВЛЕНИЕ URL-ССЫЛОК');
        console.log('='.repeat(50));
        
        // Подключение к БД
        const isConnected = await db.testConnection();
        if (!isConnected) {
            console.log('❌ Нет подключения к БД');
            return;
        }
        console.log('✅ Подключение к БД установлено');
        
        // Получаем изображения с истекшими ссылками
        const images = await db.query('SELECT * FROM images WHERE url LIKE "%downloader.disk.yandex.ru%" ORDER BY id');
        console.log(`📊 Найдено изображений для обновления: ${images.length}`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < Math.min(images.length, 10); i++) { // Ограничиваем первыми 10 для тестирования
            const image = images[i];
            console.log(`\n${i + 1}. ID: ${image.id} - ${image.title || image.alt_text}`);
            
            // Проверяем, истек ли URL
            try {
                const checkResponse = await axios.head(image.url, { 
                    timeout: 5000,
                    validateStatus: function (status) {
                        return status >= 200 && status < 500;
                    }
                });
                
                if (checkResponse.status >= 200 && checkResponse.status < 300) {
                    console.log('   ✅ URL работает, пропускаем');
                    continue;
                }
            } catch (error) {
                console.log('   🔴 URL недоступен, обновляем');
            }
            
            // Извлекаем имя файла из URL
            const fileNameMatch = image.url.match(/filename=([^&]+)/);
            if (fileNameMatch) {
                const fileName = decodeURIComponent(fileNameMatch[1]);
                console.log('   📁 Имя файла:', fileName);
                
                // Попробуем поиск файла через API поиска
                try {
                    const searchResponse = await axios.get(
                        `https://cloud-api.yandex.net/v1/disk/resources/files?fields=items.name,items.public_url,items.path&limit=50`,
                        {
                            headers: {
                                'Authorization': `OAuth ${YANDEX_TOKEN}`
                            },
                            timeout: 10000
                        }
                    );
                    
                    const files = searchResponse.data.items || [];
                    const foundFile = files.find(file => 
                        file.name === fileName || 
                        file.name.toLowerCase() === fileName.toLowerCase()
                    );
                    
                    if (foundFile && foundFile.public_url) {
                        console.log('   🎯 Файл найден!');
                        
                        // Получаем новую прямую ссылку
                        const newUrl = await getNewDownloadUrl(foundFile.public_url);
                        if (newUrl) {
                            // Обновляем в БД
                            await db.query(
                                'UPDATE images SET url = ?, direct_url = ? WHERE id = ?',
                                [newUrl, newUrl, image.id]
                            );
                            
                            console.log('   ✅ URL обновлен в БД');
                            successCount++;
                        } else {
                            console.log('   ❌ Не удалось получить прямую ссылку');
                            errorCount++;
                        }
                    } else {
                        console.log('   ❌ Файл не найден в поиске');
                        errorCount++;
                    }
                    
                } catch (searchError) {
                    console.log('   ❌ Ошибка поиска:', searchError.message);
                    errorCount++;
                }
            } else {
                console.log('   ❌ Не удалось извлечь имя файла из URL');
                errorCount++;
            }
            
            // Пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('\n📊 РЕЗУЛЬТАТЫ:');
        console.log(`✅ Успешно обновлено: ${successCount}`);
        console.log(`❌ Ошибок: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('\n🎉 URL обновлены! Проверьте страницы в браузере.');
        } else {
            console.log('\n💡 Попробуйте другой подход или обратитесь к администратору Яндекс.Диска.');
        }
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    }
}

simpleUrlFix(); 