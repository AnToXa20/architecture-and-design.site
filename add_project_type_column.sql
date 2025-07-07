-- SQL код для добавления столбца project_type в таблицу projects
-- Этот столбец будет отвечать за тип проекта (жилые интерьеры, загородные дома, офисные интерьеры)

-- Добавляем новый столбец project_type
ALTER TABLE `projects` 
ADD COLUMN `project_type` ENUM('residential', 'country', 'office') DEFAULT NULL 
AFTER `description`;

-- Комментарий к столбцу для понимания значений
ALTER TABLE `projects` 
MODIFY COLUMN `project_type` ENUM('residential', 'country', 'office') DEFAULT NULL 
COMMENT 'Тип проекта: residential - Жилые интерьеры, country - Загородные дома, office - Офисные интерьеры';

-- Обновляем существующие записи, если в description уже есть тип проекта
UPDATE `projects` 
SET `project_type` = 'residential' 
WHERE `description` = 'residential' OR `description` LIKE '%residential%';

UPDATE `projects` 
SET `project_type` = 'country' 
WHERE `description` = 'country' OR `description` LIKE '%country%' OR `description` LIKE '%загородн%';

UPDATE `projects` 
SET `project_type` = 'office' 
WHERE `description` = 'office' OR `description` LIKE '%office%' OR `description` LIKE '%офис%';

-- Проверяем результат
SELECT id, title, description, project_type FROM `projects` ORDER BY id; 