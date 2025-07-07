-- --------------------------------------------------------
-- Таблица для контентных блоков проектов портфолио
-- Поддерживает 5 типов контента с локальными изображениями
-- --------------------------------------------------------

--
-- Структура таблицы `project_content_blocks`
--

CREATE TABLE `project_content_blocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `block_type` enum('text','image','image_text','two_images','text_image') NOT NULL DEFAULT 'text',
  `content` text DEFAULT NULL,
  `image_path` varchar(500) DEFAULT NULL,
  `image_path_2` varchar(500) DEFAULT NULL,
  `image_alt` varchar(255) DEFAULT NULL,
  `image_alt_2` varchar(255) DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_project_content` (`project_id`, `sort_order`),
  KEY `idx_block_type` (`block_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Ограничения внешнего ключа для таблицы `project_content_blocks`
--
ALTER TABLE `project_content_blocks`
  ADD CONSTRAINT `project_content_blocks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------
-- Комментарии к типам блоков:
-- 'text' - только текстовый контент
-- 'image' - только изображение с подписью
-- 'image_text' - изображение с текстом рядом
-- 'two_images' - два изображения рядом
-- 'text_image' - текст с изображением внизу
-- --------------------------------------------------------

-- Пример данных для демонстрации структуры
-- INSERT INTO `project_content_blocks` (`project_id`, `block_type`, `content`, `image_path`, `image_alt`, `caption`, `sort_order`) VALUES
-- (1, 'text', 'Описание проекта загородного дома в современном стиле...', NULL, NULL, NULL, 0),
-- (1, 'image', NULL, '/pic2/Portfolio-test-images/Дом в КП Клуб 20\'71.jpg', 'Фасад дома', 'Главный фасад дома в КП Клуб 20\'71', 1),
-- (1, 'image_text', 'Интерьер гостиной выполнен в минималистическом стиле...', '/pic2/Portfolio-test-images/Интерьеры Дома в КП Клуб 20\'71.jpg', 'Интерьер гостиной', 'Просторная гостиная с панорамными окнами', 2),
-- (1, 'two_images', NULL, '/pic2/Portfolio-test-images/image1.jpg', '/pic2/Portfolio-test-images/image2.jpg', 'Детали интерьера', 'Детали отделки и мебели', 3); 