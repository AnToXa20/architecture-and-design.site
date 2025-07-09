-- Исправление путей к изображениям слайдера
-- Заменяем пробелы на подчеркивания в именах файлов

UPDATE images SET 
    url = '/pic2/main-slider/00_Дом_КП_Третья_охота.jpg', 
    direct_url = '/pic2/main-slider/00_Дом_КП_Третья_охота.jpg' 
WHERE id = 4;

-- Проверяем результат
SELECT id, url, direct_url, title FROM images WHERE entity_type = 'slider' ORDER BY sort_order; 