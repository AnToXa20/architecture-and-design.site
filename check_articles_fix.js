const axios = require('axios');

async function checkArticlesFix() {
    console.log('🔍 ДИАГНОСТИКА ПРОБЛЕМ С ИЗОБРАЖЕНИЯМИ СТАТЕЙ');
    console.log('='.repeat(60));
    
    try {
        // 1. Проверяем доступность API
        console.log('\n1️⃣ Проверка доступности API...');
        
        const articlesResponse = await axios.get('http://localhost:3001/api/db/articles');
        console.log('✅ API списка статей доступен');
        console.log(`📊 Статей в БД: ${articlesResponse.data.articles?.length || 0}`);
        
        if (!articlesResponse.data.articles || articlesResponse.data.articles.length === 0) {
            console.log('⚠️ Статьи отсутствуют в базе данных');
            return;
        }
        
        // 2. Проверяем каждую статью детально
        console.log('\n2️⃣ Детальная проверка статей...');
        
        for (let i = 0; i < articlesResponse.data.articles.length; i++) {
            const article = articlesResponse.data.articles[i];
            console.log(`\n📄 Статья ${i + 1}: ${article.title}`);
            console.log(`   ID: ${article.id}`);
            console.log(`   Главное изображение: ${article.main_image_url ? 'ЕСТЬ' : 'НЕТ'}`);
            
            if (article.main_image_url) {
                console.log(`   URL: ${article.main_image_url.substring(0, 80)}...`);
                
                // Проверяем доступность изображения
                try {
                    const imageCheck = await axios.head(article.main_image_url, { timeout: 5000 });
                    console.log(`   🟢 Изображение доступно (статус: ${imageCheck.status})`);
                } catch (error) {
                    console.log(`   🔴 Изображение недоступно: ${error.message}`);
                }
            }
            
            // Проверяем блоки контента
            try {
                const detailResponse = await axios.get(`http://localhost:3001/api/db/articles/${article.id}`);
                const contentBlocks = detailResponse.data.article?.contentBlocks || [];
                const imageBlocks = contentBlocks.filter(block => block.block_type === 'image');
                
                console.log(`   Блоков контента: ${contentBlocks.length}`);
                console.log(`   Блоков с изображениями: ${imageBlocks.length}`);
                
                for (let j = 0; j < imageBlocks.length; j++) {
                    const block = imageBlocks[j];
                    console.log(`     Блок ${j + 1}: ${block.image_url ? 'ЕСТЬ URL' : 'НЕТ URL'}`);
                    
                    if (block.image_url) {
                        try {
                            const blockImageCheck = await axios.head(block.image_url, { timeout: 5000 });
                            console.log(`     🟢 Изображение блока доступно (статус: ${blockImageCheck.status})`);
                        } catch (error) {
                            console.log(`     🔴 Изображение блока недоступно: ${error.message}`);
                        }
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ Ошибка получения деталей статьи: ${error.message}`);
            }
        }
        
        // 3. Проверяем страницы в браузере
        console.log('\n3️⃣ Проверка HTML страниц...');
        
        try {
            const articlesPageResponse = await axios.get('http://localhost:3001/articles.html');
            console.log('✅ Страница articles.html доступна');
        } catch (error) {
            console.log('❌ Страница articles.html недоступна:', error.message);
        }
        
        try {
            const articlePageResponse = await axios.get('http://localhost:3001/article.html');
            console.log('✅ Страница article.html доступна');
        } catch (error) {
            console.log('❌ Страница article.html недоступна:', error.message);
        }
        
        // 4. Рекомендации
        console.log('\n4️⃣ Рекомендации по исправлению:');
        console.log('💡 Проверьте в браузере:');
        console.log('   - http://localhost:3001/articles.html');
        console.log('   - http://localhost:3001/test_images_debug.html');
        console.log('   - Консоль разработчика (F12) для ошибок JavaScript');
        console.log('   - Вкладку Network для проверки загрузки изображений');
        
        console.log('\n🔧 Возможные причины проблем:');
        console.log('   1. CORS блокировка изображений с Яндекс.Диска');
        console.log('   2. Истёкшие токены доступа к изображениям');
        console.log('   3. Блокировка смешанного контента (HTTP/HTTPS)');
        console.log('   4. Ошибки в JavaScript коде страниц');
        
    } catch (error) {
        console.error('❌ Критическая ошибка диагностики:', error.message);
    }
}

checkArticlesFix(); 