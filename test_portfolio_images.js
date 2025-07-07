const axios = require('axios');

async function testPortfolioImages() {
    console.log('🔍 ТЕСТИРОВАНИЕ ИЗОБРАЖЕНИЙ ПОРТФОЛИО');
    console.log('='.repeat(50));
    
    try {
        // Получаем данные портфолио
        console.log('\n📡 Получение данных портфолио...');
        const response = await axios.get('http://localhost:3001/api/portfolio');
        
        if (!response.data.success) {
            console.log('❌ API портфолио недоступен');
            return;
        }
        
        const portfolioData = response.data.data;
        console.log('✅ API портфолио работает');
        console.log(`📊 Всего проектов: ${portfolioData.all?.length || 0}`);
        console.log(`🏠 Квартиры: ${portfolioData.apartments?.length || 0}`);
        console.log(`🏡 Дома: ${portfolioData.houses?.length || 0}`);
        console.log(`🏢 Офисы: ${portfolioData.offices?.length || 0}`);
        
        // Тестируем изображения из разных категорий
        const testSamples = [
            { category: 'apartments', data: portfolioData.apartments?.slice(0, 3) || [] },
            { category: 'houses', data: portfolioData.houses?.slice(0, 3) || [] },
            { category: 'offices', data: portfolioData.offices?.slice(0, 3) || [] }
        ];
        
        console.log('\n🖼️ Тестирование изображений:');
        
        for (const sample of testSamples) {
            console.log(`\n--- ${sample.category.toUpperCase()} ---`);
            
            if (sample.data.length === 0) {
                console.log('⚠️ Нет данных для тестирования');
                continue;
            }
            
            for (let i = 0; i < sample.data.length; i++) {
                const project = sample.data[i];
                console.log(`\n${i + 1}. ${project.title} (ID: ${project.id})`);
                
                // Тестируем URL
                if (project.url) {
                    try {
                        const imageCheck = await axios.head(project.url, { 
                            timeout: 8000,
                            validateStatus: function (status) {
                                return status >= 200 && status < 500; // Принимаем любой статус для анализа
                            }
                        });
                        
                        if (imageCheck.status >= 200 && imageCheck.status < 300) {
                            console.log(`   ✅ URL работает (статус: ${imageCheck.status})`);
                            console.log(`   📏 Размер: ${imageCheck.headers['content-length'] || 'unknown'} байт`);
                        } else {
                            console.log(`   ⚠️ URL вернул статус: ${imageCheck.status}`);
                        }
                        
                    } catch (error) {
                        console.log(`   ❌ URL недоступен: ${error.message}`);
                        if (error.response?.status) {
                            console.log(`   📊 HTTP статус: ${error.response.status}`);
                        }
                    }
                } else {
                    console.log('   ⚠️ URL отсутствует');
                }
                
                // Тестируем direct_url если есть
                if (project.direct_url && project.direct_url !== project.url) {
                    try {
                        const directCheck = await axios.head(project.direct_url, { 
                            timeout: 8000,
                            validateStatus: function (status) {
                                return status >= 200 && status < 500;
                            }
                        });
                        
                        if (directCheck.status >= 200 && directCheck.status < 300) {
                            console.log(`   ✅ Direct URL работает (статус: ${directCheck.status})`);
                        } else {
                            console.log(`   ⚠️ Direct URL вернул статус: ${directCheck.status}`);
                        }
                        
                    } catch (error) {
                        console.log(`   ❌ Direct URL недоступен: ${error.message}`);
                    }
                }
                
                // Показываем короткую версию URL для анализа
                const shortUrl = project.url ? project.url.substring(0, 80) + '...' : 'отсутствует';
                console.log(`   🔗 URL: ${shortUrl}`);
            }
        }
        
        console.log('\n📋 РЕЗУЛЬТАТЫ:');
        console.log('💡 Проверьте страницу портфолио в браузере:');
        console.log('   http://localhost:3001/portfolio.html');
        console.log('🔧 Если изображения не загружаются, возможные причины:');
        console.log('   1. Истекшие токены Яндекс.Диска (статус 410)');
        console.log('   2. CORS блокировка браузера');
        console.log('   3. Медленная загрузка изображений');
        console.log('   4. Проблемы с сетью');
        
    } catch (error) {
        console.error('❌ Критическая ошибка:', error.message);
    }
}

testPortfolioImages(); 