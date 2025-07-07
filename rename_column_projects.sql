-- SQL код для переименования столбца main_image_url в path_to_file в таблице projects
-- Выполнить в phpMyAdmin для базы данных architecture_bureau

USE `architecture_bureau`;

ALTER TABLE `projects` 
CHANGE COLUMN `main_image_url` `path_to_file` varchar(255) DEFAULT NULL; 