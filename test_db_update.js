const db = require('./db');

async function updateDatabase() {
    try {
        console.log('Проверка подключения к базе данных...');
        const isConnected = await db.testConnection();
        
        if (!isConnected) {
            console.error('Не удалось подключиться к базе данных');
            process.exit(1);
        }
        
        console.log('Подключение к БД установлено. Начинаем обновления...');
        
        // 1. Проверяем существующую структуру таблицы articles
        console.log('\n1. Проверка текущей структуры таблицы articles...');
        try {
            const articlesStructure = await db.query('DESCRIBE articles');
            console.log('Структура таблицы articles:', articlesStructure.map(col => col.Field));
            
            // Проверяем, нужно ли добавлять новые столбцы
            const existingColumns = articlesStructure.map(col => col.Field);
            const needsUpdate = !existingColumns.includes('category') || 
                               !existingColumns.includes('created_at') || 
                               !existingColumns.includes('updated_at');
            
            if (needsUpdate) {
                console.log('Добавляем новые столбцы в таблицу articles...');
                
                if (!existingColumns.includes('category')) {
                    await db.query('ALTER TABLE articles ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT "general" AFTER slug');
                    console.log('✓ Добавлен столбец category');
                }
                
                if (!existingColumns.includes('created_at')) {
                    await db.query('ALTER TABLE articles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER publication_date');
                    console.log('✓ Добавлен столбец created_at');
                }
                
                if (!existingColumns.includes('updated_at')) {
                    await db.query('ALTER TABLE articles ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
                    console.log('✓ Добавлен столбец updated_at');
                }
                
                // Переименовываем excerpt в short_description если нужно
                if (existingColumns.includes('excerpt') && !existingColumns.includes('short_description')) {
                    await db.query('ALTER TABLE articles CHANGE excerpt short_description TEXT');
                    console.log('✓ Переименован столбец excerpt в short_description');
                }
            } else {
                console.log('✓ Таблица articles уже обновлена');
            }
        } catch (error) {
            console.error('Ошибка обновления таблицы articles:', error.message);
        }
        
        // 2. Проверяем и обновляем таблицу content_blocks
        console.log('\n2. Проверка и обновление таблицы content_blocks...');
        try {
            const contentBlocksStructure = await db.query('DESCRIBE content_blocks');
            console.log('Структура таблицы content_blocks:', contentBlocksStructure.map(col => col.Field));
            
            const existingColumns = contentBlocksStructure.map(col => col.Field);
            
            // Проверяем тип block_type
            const blockTypeColumn = contentBlocksStructure.find(col => col.Field === 'block_type');
            const needsTypeUpdate = !blockTypeColumn.Type.includes('image');
            
            if (needsTypeUpdate) {
                await db.query("ALTER TABLE content_blocks MODIFY block_type ENUM('text','quote','list','subtitle','image') NOT NULL DEFAULT 'text'");
                console.log('✓ Обновлен тип столбца block_type');
            }
            
            if (!existingColumns.includes('image_url')) {
                await db.query('ALTER TABLE content_blocks ADD COLUMN image_url TEXT AFTER content');
                console.log('✓ Добавлен столбец image_url');
            }
            
            if (!existingColumns.includes('caption')) {
                await db.query('ALTER TABLE content_blocks ADD COLUMN caption VARCHAR(500) AFTER image_url');
                console.log('✓ Добавлен столбец caption');
            }
            
            if (needsTypeUpdate || !existingColumns.includes('image_url') || !existingColumns.includes('caption')) {
                console.log('✓ Таблица content_blocks обновлена');
            } else {
                console.log('✓ Таблица content_blocks уже обновлена');
            }
        } catch (error) {
            console.error('Ошибка обновления таблицы content_blocks:', error.message);
        }
        
        // 3. Проверяем наличие архитекторов
        console.log('\n3. Проверка данных архитекторов...');
        try {
            const architectsCount = await db.query('SELECT COUNT(*) as count FROM architects');
            console.log(`Найдено архитекторов: ${architectsCount[0].count}`);
            
            if (architectsCount[0].count === 0) {
                console.log('Добавляем тестовых архитекторов...');
                await db.query(`
                    INSERT INTO architects (id, full_name, position, bio, email, phone, sort_order) VALUES
                    (1, 'Иванов Иван Иванович', 'Главный архитектор', 'Опытный архитектор с более чем 15-летним стажем в проектировании жилых и коммерческих объектов.', 'i.ivanov@architecture-bureau.com', '+7 (495) 123-45-67', 1),
                    (2, 'Петрова Елена Сергеевна', 'Дизайнер интерьеров', 'Талантливый дизайнер интерьеров с тонким чувством стиля и цвета.', 'e.petrova@architecture-bureau.com', '+7 (495) 123-45-68', 2),
                    (3, 'Сидоров Алексей Михайлович', 'Архитектор', 'Молодой и перспективный архитектор, выпускник МАРХИ.', 'a.sidorov@architecture-bureau.com', '+7 (495) 123-45-69', 3),
                    (4, 'Козлова Мария Андреевна', 'Младший архитектор', 'Начинающий архитектор с большим потенциалом и свежими идеями.', 'm.kozlova@architecture-bureau.com', '+7 (495) 123-45-70', 4)
                `);
                console.log('✓ Добавлены тестовые архитекторы');
            } else {
                console.log('✓ Архитекторы уже есть в базе данных');
            }
        } catch (error) {
            console.error('Ошибка при добавлении архитекторов:', error.message);
        }
        
        // 4. Финальная проверка
        console.log('\n4. Финальная проверка структуры БД...');
        
        // Проверяем обновленную структуру articles
        const updatedArticlesStructure = await db.query('DESCRIBE articles');
        console.log('Финальная структура articles:', updatedArticlesStructure.map(col => `${col.Field} (${col.Type})`));
        
        // Проверяем обновленную структуру content_blocks
        const updatedContentBlocksStructure = await db.query('DESCRIBE content_blocks');
        console.log('Финальная структура content_blocks:', updatedContentBlocksStructure.map(col => `${col.Field} (${col.Type})`));
        
        // Проверяем количество архитекторов
        const finalArchitectsCount = await db.query('SELECT COUNT(*) as count FROM architects');
        console.log(`Всего архитекторов в БД: ${finalArchitectsCount[0].count}`);
        
        console.log('\n✅ База данных успешно обновлена и готова для работы со статьями!');
        
    } catch (error) {
        console.error('Критическая ошибка при обновлении БД:', error.message);
        process.exit(1);
    }
}

// Запускаем обновление
updateDatabase(); 