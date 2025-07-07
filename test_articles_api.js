const axios = require('axios');

async function testArticlesAPI() {
    try {
        console.log('=== ТЕСТИРОВАНИЕ API СТАТЕЙ ===');
        
        // Тест списка статей
        console.log('\n1. Тестирование списка статей...');
        try {
            const articlesResponse = await axios.get('http://localhost:3001/api/db/articles');
            console.log('✅ API списка статей работает');
            console.log('📊 Статей найдено:', articlesResponse.data.articles?.length || 0);
            
            if (articlesResponse.data.articles && articlesResponse.data.articles.length > 0) {
                const firstArticle = articlesResponse.data.articles[0];
                console.log('📄 Первая статья:', {
                    id: firstArticle.id,
                    title: firstArticle.title,
                    hasMainImage: !!firstArticle.main_image_url,
                    imageUrl: firstArticle.main_image_url ? firstArticle.main_image_url.substring(0, 50) + '...' : 'нет'
                });
                
                // Тест конкретной статьи
                console.log('\n2. Тестирование конкретной статьи...');
                try {
                    const articleResponse = await axios.get(`http://localhost:3001/api/db/articles/${firstArticle.id}`);
                    console.log('✅ API конкретной статьи работает');
                    console.log('📄 Статья загружена:', {
                        id: articleResponse.data.article.id,
                        title: articleResponse.data.article.title,
                        hasMainImage: !!articleResponse.data.article.main_image_url,
                        contentBlocks: articleResponse.data.article.contentBlocks?.length || 0,
                        architects: articleResponse.data.article.architects?.length || 0
                    });
                    
                    // Проверяем изображения в блоках контента
                    if (articleResponse.data.article.contentBlocks) {
                        const imageBlocks = articleResponse.data.article.contentBlocks.filter(block => block.block_type === 'image');
                        console.log('🖼️ Блоков с изображениями:', imageBlocks.length);
                        
                        imageBlocks.forEach((block, index) => {
                            console.log(`   Блок ${index + 1}:`, {
                                hasImageUrl: !!block.image_url,
                                caption: block.caption || 'без подписи'
                            });
                        });
                    }
                    
                } catch (error) {
                    console.log('❌ API конкретной статьи недоступно:', error.message);
                }
            } else {
                console.log('⚠️ Статьи не найдены в БД');
            }
            
        } catch (error) {
            console.log('❌ API списка статей недоступно:', error.message);
        }
        
        console.log('\n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===');
        
    } catch (error) {
        console.error('Критическая ошибка тестирования:', error.message);
    }
}

testArticlesAPI(); 