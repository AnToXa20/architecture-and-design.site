const axios = require('axios');

async function testAPI() {
    try {
        console.log('Тестирование API...');
        
        const response = await axios.get('http://localhost:3001/api/portfolio');
        
        if (response.data.success) {
            console.log('✓ API работает успешно');
            console.log(`Всего изображений: ${response.data.total}`);
            console.log('Счетчики по типам:');
            console.log(`- Все: ${response.data.counts.all}`);
            console.log(`- Квартиры: ${response.data.counts.apartments}`);
            console.log(`- Дома: ${response.data.counts.houses}`);
            console.log(`- Офисы: ${response.data.counts.offices}`);
        } else {
            console.log('✗ API вернул ошибку:', response.data.error);
        }
        
    } catch (error) {
        console.log('✗ Ошибка подключения к API:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('Сервер не запущен или недоступен');
        }
    }
}

testAPI(); 