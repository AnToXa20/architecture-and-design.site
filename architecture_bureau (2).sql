-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Июл 05 2025 г., 18:28
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `architecture_bureau`
--

-- --------------------------------------------------------

--
-- Структура таблицы `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('admin','editor','viewer') NOT NULL DEFAULT 'editor'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `admins`
--

INSERT INTO `admins` (`id`, `username`, `password_hash`, `email`, `full_name`, `role`) VALUES
(1, 'anton1', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', 't_anton08@mail.ru', 'Антон Тощев', 'admin'),
(2, '1', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b', '1@1', '1', 'admin'),
(4, '2', 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35', '2@2.ru', '2', 'admin');

-- --------------------------------------------------------

--
-- Структура таблицы `architects`
--

CREATE TABLE `architects` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `position` varchar(100) NOT NULL,
  `bio` text DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `architects`
--

INSERT INTO `architects` (`id`, `full_name`, `position`, `bio`, `photo_url`, `email`, `phone`, `sort_order`) VALUES
(1, 'Иванов Иван', 'Главный архитектор', 'Опыт работы 15 лет. Образование: Московский архитектурный институт, специальность \"Архитектура жилых и общественных зданий\". Стажировался в ведущих архитектурных бюро Европы. Специализация: проектирование жилых и общественных зданий, авторский надзор, разработка генеральных планов, концептуальное проектирование. Руководил более чем 50 проектами различной сложности. Лауреат профессиональных премий в области архитектуры. Автор публикаций в специализированных изданиях по архитектуре и градостроительству.', '/pic2/architects/Ivan.png', 'i.ivanov@architecture-bureau.com', '+7 (495) 123-45-67', 1),
(2, 'Петрова Елена', 'Дизайнер интерьеров', 'Опыт работы 12 лет. Образование: Британская высшая школа дизайна, специальность \"Дизайн интерьера\". Дополнительное образование по цветовой психологии и эргономике пространства. Специализация: жилые и коммерческие интерьеры, эргономика пространства, подбор отделочных материалов, разработка индивидуальной мебели, световые решения. Реализовала более 80 интерьерных проектов. Участница международных выставок дизайна. Ведет авторский курс по дизайну интерьеров в онлайн-школе.', '/pic2/architects/Elena.png', 'e.petrova@architecture-bureau.com', '+7 (495) 123-45-68', 2),
(3, 'Сидоров Алексей', 'Архитектор', 'Опыт работы 7 лет. Образование: Санкт-Петербургский государственный архитектурно-строительный университет, магистр архитектуры. Прошел дополнительное обучение по BIM-проектированию. Специализация: проектирование жилых зданий, разработка технической документации, авторский надзор, параметрическое проектирование. Владеет технологиями компьютерного моделирования и расчета конструкций. Призер всероссийских архитектурных конкурсов. Постоянно совершенствует навыки в области устойчивой архитектуры и энергоэффективного строительства.', '/pic2/architects/Alexey.png', 'a.sidorov@architecture-bureau.com', '+7 (495) 123-45-69', 3),
(4, 'Козлова Мария', 'Младший архитектор', 'Опыт работы 4 года. Образование: Московский архитектурный институт, бакалавр архитектуры. Дополнительное образование в области цифровой визуализации и графического дизайна. Специализация: проектирование малых архитектурных форм, создание 3D-визуализаций, разработка рабочей документации. Активно применяет инновационные подходы в архитектурном проектировании. Участница международных воркшопов по современной архитектуре. Курирует студенческие проекты в рамках сотрудничества бюро с архитектурными вузами.', '/pic2/architects/Maria.png', 'm.kozlova@architecture-bureau.com', '+7 (495) 123-45-70', 4);

-- --------------------------------------------------------

--
-- Структура таблицы `articles`
--

CREATE TABLE `articles` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'general',
  `short_description` text DEFAULT NULL,
  `main_image_url` text DEFAULT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `publication_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `articles`
--

INSERT INTO `articles` (`id`, `title`, `slug`, `category`, `short_description`, `main_image_url`, `status`, `publication_date`, `created_at`, `updated_at`) VALUES
(17, 'Как создать идеальный загородный дом: от проекта до реализации', 'kak-sozdat-idealnyy-zagorodnyy-dom-ot-proekta-do-realizacii', 'architecture', 'Загородный дом - прекрасное место для отдыха и встреч с семьей, но как же построить себе такой?', 'https://2.downloader.disk.yandex.ru/preview/78830f04b6b31cf889fdad3050843871f9d0292f8a1e78f6e43c45879d9630c6/inf/D5nYuYVoLwDIKJJgs6SqeQ60y4nNidqo6QQN4IQDsD750bdR9mAm4wNFwfo8Q8R2U05PYMwyDYvyNb5Xhlh9NA%3D%3D?uid=362045858&filename=main-image-57-053763c0z.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', 'draft', '2025-05-23', '2025-05-23 15:10:56', '2025-05-24 04:55:30'),
(18, 'Тренды в дизайне интерьеров квартир: что актуально в 2024 году?', 'trendy-v-dizayne-intererov-kvartir-chto-aktualno-v-2024-godu', 'architecture', 'Рассмотрим ключевые тренды, которые задают тон современным квартирам', 'https://1.downloader.disk.yandex.ru/preview/5de1f6128f2a6ede004c26ce1e86888e239a5e074750b74501fc28d552a012b4/inf/R8OuhPMedCM0g33jxuFS2Yiy9Iq1g5NhhJ3VuKnMbaTBBMZ_qVJUxkhjqNxkFwR1GIlwaiCZaX36h-znFikRqg%3D%3D?uid=362045858&filename=main-jpg200095c3cb40-b233-4804-87b8-c7f1e7151d27-772758zj6.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'draft', '2024-09-11', '2025-05-23 17:19:34', '2025-05-24 04:55:46'),
(23, 'Секреты уютного интерьера: какие материалы выбрать?', 'sekrety-uyutnogo-interera-kakie-materialy-vybrat', 'interior', 'Расскажем про создание уютного интерьера. которое достигается через гармоничное сочетание натуральных материалов и современных технологий.', 'https://4.downloader.disk.yandex.ru/preview/225902b8c962a2b9cd6b00a79d2a55b6200e719cef540da3ac00321c356d3123/inf/KHhwbLKs3_fSQ1swaW5qGR_P1euBTbViVm4HUb2iEsJEIwrShmugjGCvvVqso568sbAlUWSBZlSeIMJpwOm5Gg%3D%3D?uid=362045858&filename=main-ogog1715597614272159045-910209cka.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'draft', '2025-05-07', '2025-05-23 18:28:31', '2025-05-24 04:55:59');

-- --------------------------------------------------------

--
-- Структура таблицы `article_architects`
--

CREATE TABLE `article_architects` (
  `article_id` int(11) NOT NULL,
  `architect_id` int(11) NOT NULL,
  `is_main_author` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `article_architects`
--

INSERT INTO `article_architects` (`article_id`, `architect_id`, `is_main_author`) VALUES
(17, 1, 1),
(18, 3, 1),
(23, 4, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `article_tags`
--

CREATE TABLE `article_tags` (
  `article_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `content_blocks`
--

CREATE TABLE `content_blocks` (
  `id` int(11) NOT NULL,
  `entity_type` enum('project','article') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `block_type` enum('text','quote','list','subtitle','image') NOT NULL DEFAULT 'text',
  `content` text NOT NULL,
  `image_url` text DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `content_blocks`
--

INSERT INTO `content_blocks` (`id`, `entity_type`, `entity_id`, `block_type`, `content`, `image_url`, `caption`, `sort_order`) VALUES
(31, 'article', 17, 'text', 'Загородный дом — это воплощение мечты для многих людей. Это место, где можно уединиться от городской суеты, насладиться тишиной и природой, создать пространство, полностью отвечающее личным предпочтениям и потребностям. Однако, чтобы построить идеальный дом, нужно учитывать множество факторов: от выбора подходящего участка до оформления интерьера. Процесс создания такого дома состоит из нескольких важных этапов, каждый из которых требует тщательного планирования и внимания к деталям.\n\nПервым и, пожалуй, одним из самых важных шагов является выбор участка для строительства. Участок — это основа вашего будущего дома, и от его характеристик во многом зависит удобство жизни и стоимость строительных работ. Оптимальный участок должен быть удобно расположен относительно важных объектов инфраструктуры. Например, для семьи с детьми важно наличие школ и детских садов поблизости, а для работающих людей — удобный доступ к основным магистралям. Также необходимо учитывать коммуникации: наличие электричества, водоснабжения, газа и канализации значительно облегчает строительство и эксплуатацию дома.\n\nОсобенности грунта и ландшафта также имеют большое значение. Глинистые почвы, например, требуют дополнительного укрепления фундамента, что увеличивает затраты. Песчаные почвы более просты для строительства, но менее устойчивы к нагрузкам. Ландшафт участка — это не только вопрос эстетики, но и функциональности. Участок на склоне может потребовать террасирования, но он же может предложить потрясающий вид из окон. Важно также учитывать ориентацию участка: расположение дома относительно сторон света влияет на освещенность помещений.', NULL, NULL, 0),
(32, 'article', 17, 'image', '', 'https://1.downloader.disk.yandex.ru/preview/30e4bf5ed2b1e076085167b071a14a6a3b55a961a28e510852641da30617e837/inf/9FwGLZmRC62CfNL0q_pIqNm1AmfSMZgclpJ7bgbqOBW_T_kqDuq1ffoCwLaFN400mYz7SKOH7UuYyBGx7_GH_Q%3D%3D?uid=362045858&filename=block1-image-57-056055jzp.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '', 1),
(33, 'article', 17, 'text', 'После выбора участка наступает этап разработки архитектурного проекта. Это процесс, который требует глубокого анализа потребностей будущих жителей. Например, для семьи с детьми необходимо предусмотреть просторные общие зоны, такие как гостиная или игровая, а также отдельные детские комнаты. Для тех, кто работает из дома, важно создать удобный кабинет, который будет изолирован от шума.\n\nСтиль дома играет ключевую роль в создании гармоничного пространства. Современные загородные дома часто оформляют в минималистическом стиле, который предполагает чистые линии, функциональность и использование натуральных материалов. Другие популярные стили включают классику, скандинавский стиль и экостиль, каждый из которых имеет свои особенности и преимущества. Важной частью проектирования является планировка: открытые пространства, большие окна, выходящие на южную сторону, и зоны для отдыха делают дом более комфортным и светлым.\n\nПосле завершения проектирования наступает этап строительства. Строительство начинается с закладки фундамента, который является основой дома. Ленточный фундамент подходит для большинства условий, однако в случае сложных грунтов лучше выбрать плитный или свайный фундамент. На следующем этапе возводятся стены. Выбор материала для стен зависит от предпочтений и бюджета: кирпич обеспечивает долговечность, газобетон легок и прост в обработке, а дерево создает уют и экологичность.', NULL, NULL, 2),
(34, 'article', 17, 'image', '', 'https://1.downloader.disk.yandex.ru/preview/457caf6d7cf3063fd3273a648824011942e9e4914a1099270d4d1719e8214007/inf/pGj7rpYkCFvLlqXJF0WmFQ60y4nNidqo6QQN4IQDsD5C8NGm4yF_RaqIAGF29AANemeS379iKIslXmS79yOaSw%3D%3D?uid=362045858&filename=block3-image-58-058147qre.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 3),
(35, 'article', 17, 'image', '', 'https://1.downloader.disk.yandex.ru/preview/f16b32273c1611b306f7f35a7dfda0acd01f849e1b29e2564997e40196f8414b/inf/Rm1nX-Fc0uM4UqcExcIPe859xDA1hN2uzXb9vHhBGQL6K3XqJ0n3AuogpsN3uRaI_qb4wivvcoSGWdkFCAbvyg%3D%3D?uid=362045858&filename=block4-image-59-060432s7k.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 4),
(36, 'article', 17, 'text', 'Крыша дома играет не только защитную роль, но и эстетическую. Металлочерепица — это прочный и доступный материал, а натуральная черепица придаёт дому более солидный вид. Также важно учесть установку инженерных коммуникаций: системы водоснабжения, отопления и вентиляции должны быть продуманы заранее.\n\nОформление интерьера — это этап, который придает дому индивидуальность. При выборе цветовой гаммы рекомендуется отдавать предпочтение светлым и нейтральным оттенкам: белый, серый, бежевый. Они визуально увеличивают пространство и создают ощущение лёгкости. Мебель и декор должны сочетаться между собой и подчёркивать выбранный стиль.\n\nОсвещение играет важную роль в создании атмосферы. Для загородных домов характерно многоуровневое освещение: потолочные светильники, настенные бра и торшеры. Для создания уюта можно использовать свечи, гирлянды или камин.', NULL, NULL, 5),
(37, 'article', 17, 'image', '', 'https://3.downloader.disk.yandex.ru/preview/7cb7099c987401cc151e8191bd0a08041de5afc47ee3f877017834d297b9835d/inf/IX1qK1REQhyrDDnPv06sZsjK2YYB591LWMQcM6-uV1YQWxkxqoYyMnQXW0lTd0Nx31jgj6nprW31vfTyib2M3Q%3D%3D?uid=362045858&filename=block6-image-60-062510try.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 6),
(38, 'article', 17, 'text', 'Не менее важным этапом является благоустройство территории. Территория вокруг дома — это продолжение вашего пространства, поэтому её стоит обустроить с той же тщательностью, что и интерьер. Популярные элементы ландшафтного дизайна включают террасы, беседки, зоны для барбекю. Растительность также играет важную роль: деревья, кустарники, цветники создают уют и подчёркивают связь с природой.\n\nДорожки из натурального камня или дерева, небольшие водоёмы, такие как пруд или фонтан, дополнят общий стиль. Если участок позволяет, можно создать спортивную или детскую площадку. Для тех, кто любит садоводство, подойдут теплицы или огород.\n\nТаким образом, создание идеального загородного дома — это сложный, но увлекательный процесс. Каждый этап, от выбора участка до оформления интерьера и благоустройства территории, играет важную роль. Только внимание к деталям и тщательное планирование позволят создать дом, который будет соответствовать всем вашим ожиданиям.', NULL, NULL, 7),
(39, 'article', 18, 'text', 'В 2024 году дизайн интерьеров продолжает балансировать между функциональностью, экологичностью и эстетикой. На первый план выходят решения, которые не только радуют глаз, но и делают жизнь комфортнее, а пространство — гармоничнее. Рассмотрим ключевые тренды, которые задают тон современным квартирам.', NULL, NULL, 0),
(40, 'article', 18, 'image', 'Натуральные материалы и экологичный подход', 'https://1.downloader.disk.yandex.ru/preview/3ac89868a37309012559501b2f47b98ecdba353d793bfda407e522368492fc71/inf/p84QfLjaYoqNoKT54d4qhIiy9Iq1g5NhhJ3VuKnMbaT7wJA1Y3SRKUwf5Z6IoUjhruvmLrCmw82zlSx_sPzZ4A%3D%3D?uid=362045858&filename=block1-kandinsky-download-1748020434648-77493581f.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', 'Натуральные материалы и экологичный подход', 1),
(41, 'article', 18, 'text', 'Акцент на экологию остается одним из главных трендов. В интерьерах преобладают натуральные материалы: дерево, камень, пробка, лен и хлопок. Стены из необработанного кирпича или декоративной штукатурки, мебель из массива, плетеные аксессуары — все это создает атмосферу близости к природе. Дизайнеры также активно используют переработанные материалы, например, стекло и металл, а в отделке отдают предпочтение краскам с низким содержанием летучих веществ. Энергоэффективность дополняет тренд: умные системы освещения и датчики контроля микроклимата помогают сократить потребление ресурсов.', NULL, NULL, 2),
(42, 'article', 18, 'image', 'Многофункциональные пространства', 'https://2.downloader.disk.yandex.ru/preview/2ae0748e5f050bae473595ce846db824ac9b3d5a62298fb5d2f24ae80279ab96/inf/Y3DisAkVO9nOOFidDmjuqFUo7T_rA9qjiPvajVMharu3Cvt4A-PI2dl4qpaJAIyB-EA_xveN8rNv7X8MAd2JYg%3D%3D?uid=362045858&filename=block3-kandinsky-download-1748020546301-77680438v.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', 'Многофункциональные пространства', 3),
(43, 'article', 18, 'text', 'Современные квартиры все чаще совмещают несколько зон в одной комнате. Кухня перетекает в гостиную, спальня — в рабочий кабинет, а балкон превращается в мини-оранжерею. Для зонирования используют не перегородки, а цвет, фактуры и мебель: например, барная стойка отделяет кухню от столовой, а ковер визуально выделяет зону отдыха. Популярна трансформируемая мебель: откидные столы, диваны-кровати, складные стулья. Встроенные системы хранения, включая ниши и скрытые шкафы, помогают сохранить ощущение простора даже в малогабаритных помещениях.', NULL, NULL, 4),
(44, 'article', 18, 'image', 'Скандинавский минимализм с элементами бохо', 'https://4.downloader.disk.yandex.ru/preview/f87dd96ad5afde8ab949e46818f39cf0de3d0f6f5d1e983f5ff12724ccc9d761/inf/gfg7GuoDFLrHfNPuCYrxDsdUOA0kb8cEB8inUyAFFb0sgw_i5ZXry3AbkyGrmrTeZCxDgxwSqzu2Ws_oOYZc8A%3D%3D?uid=362045858&filename=block5-kandinsky-download-1748020620485-779083v59.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', 'Скандинавский минимализм с элементами бохо', 5),
(45, 'article', 18, 'text', 'Умный дом становится неотъемлемой частью интерьера, но технологии теперь «прячутся» за эстетикой. Встроенные розетки, невидимые акустические системы, подсветка, интегрированная в мебель или потолок, — все это работает на комфорт, не нарушая гармонии. Популярны сенсорные панели, голосовое управление и автоматизация сценариев (например, затемнение окон и включение проектора одним нажатием). Даже бытовая техника маскируется: холодильники и посудомоечные машины прячут за фасадами, сливающимися с кухонным гарнитуром.', NULL, NULL, 6),
(46, 'article', 18, 'image', 'Технологии, скрытые в дизайне', 'https://3.downloader.disk.yandex.ru/preview/d045492ab0c4952dc200d89f4d770ca7ba36420a0fe398a9479e4ccd466cee82/inf/JgUCMq8jiXgZEf2uBgES3PC-F9BBCGtxtWV44OO8SITopwqJ962T72IQky3gqAlZVE_wDSJXWe-iuTQ3IODopg%3D%3D?uid=362045858&filename=block7-kandinsky-download-1748020671095-780839876.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', 'Технологии, скрытые в дизайне', 7),
(47, 'article', 18, 'text', '2024 год делает ставку на интерьеры, которые отражают ценности владельцев: заботу о планете, стремление к практичности и любовь к уюту. Сочетание натуральных материалов, гибких решений и незаметных технологий создает пространства, где легко дышится, работается и отдыхается. Архитектурное бюро, которое учитывает эти тренды, поможет клиентам не просто обновить квартиру, а вдохнуть в нее новую философию жизни', NULL, NULL, 8),
(57, 'article', 22, 'text', 'Создание уютного интерьера начинается с выбора материалов, которые не только радуют глаз, но и дарят тактильное тепло и ощущение гармонии. Современный дизайн все чаще обращается к натуральности, отдавая предпочтение дереву, камню, льну и шерсти. Деревянные полы, мебель из массива или декор из необработанной древесины добавляют пространству природной мягкости, а их текстура создает эффект рукотворности. Камень, будь то мраморная столешница на кухне или грубая плитка в ванной, привносит благородную прохладу, контрастируя с теплотой дерева. Эти материалы не просто эстетичны — они экологичны, долговечны и со временем лишь подчеркивают индивидуальность интерьера.', NULL, NULL, 0),
(58, 'article', 22, 'image', '', 'https://3.downloader.disk.yandex.ru/preview/b357996ebbf12d46ec4efb5b2ff8ed481250503699892a7cac95668f4f9a28fa/inf/pz2dnoPDLI2m0IHp-ilRnvmr4w93f-RZsW195NeJlpSXj4HbJI34PDpXTDsZ1yw5uYUqnNCqnctfz51o5uIxEA%3D%3D?uid=362045858&filename=block1-kandinsky-download-1748024018859-91192768o.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 1),
(59, 'article', 22, 'text', 'Текстиль играет ключевую роль в создании уюта. Льняные шторы, шерстяные пледы, хлопковые покрывала и ковры с высоким ворсом смягчают даже самые строгие интерьеры. Слоистость фактур — например, сочетание грубой мешковины с шелковистым бархатом — добавляет глубины и интимности. Не стоит забывать и о коже: потертые кожаные кресла или диваны с годами приобретают благородный блеск, рассказывая историю дома. Важно, чтобы ткани были приятны на ощупь и функциональны: легко чистились, не накапливали пыль и сохраняли цвет даже при ярком солнечном свете.', NULL, NULL, 2),
(60, 'article', 22, 'image', '', 'https://3.downloader.disk.yandex.ru/preview/a36f9a9def7cfd0d18ead697756f50c1bb7efa6fa3ad18fb7d1d50d4712072b7/inf/e6v4_C1h3aK74jD4aNjzyd2gbmfnRUF7f5iGsaoKxlXRR5nNlorA3Vw-d_UhM07Hw85zydYU7HciaE6EtRF_-g%3D%3D?uid=362045858&filename=block3-kandinsky-download-1748024146018-914434wkz.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 3),
(61, 'article', 22, 'text', 'Современные технологии и материалы тоже могут работать на уют, если их грамотно интегрировать. Например, кварцвиниловые полы, имитирующие дерево, сочетают в себе тепло натуральных материалов и устойчивость к влаге. Декоративные штукатурки с эффектом шелка или бетона визуально обволакивают стены, создавая мягкий фон для мебели. Даже металл, если использовать его дозированно, добавляет интерьеру характер: медные светильники, черные кованые ножки стола или латунные ручки на шкафах становятся изящными акцентами. Главное — сохранять баланс между холодными и теплыми фактурами, чтобы пространство не теряло душевности.', NULL, NULL, 4),
(62, 'article', 22, 'image', '', 'https://4.downloader.disk.yandex.ru/preview/a525a82d5ace9c80680c216eb8115d9ba732b0799f1a95150545c25b7416d645/inf/yrRyGfsZD6PEEXJU36AWdIpk3lFAK1w18srva1qNXoNegLmEdhw3-DVXRR9OMqf2nA4TRwFVyDoEioW0iVpsHw%3D%3D?uid=362045858&filename=block5-kandinsky-download-1748024208948-916424lqh.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=362045858&tknv=v3&size=1920x919', '', 5),
(63, 'article', 22, 'text', 'Уют рождается там, где материалы «говорят» на одном языке с жильцами. Это может быть запах дерева, шероховатость глиняной вазы или мягкость ковра под ногами — каждая деталь должна вызывать желание остаться дома чуть дольше. Выбирая материалы, стоит прислушаться не только к трендам, но и к своим ощущениям: интерьер, который хочется обнять взглядом, всегда начинается с искренности.', NULL, NULL, 6),
(64, 'article', 23, 'text', 'Создание уютного интерьера начинается с выбора материалов, которые не только радуют глаз, но и дарят тактильное тепло и ощущение гармонии. Современный дизайн все чаще обращается к натуральности, отдавая предпочтение дереву, камню, льну и шерсти. Деревянные полы, мебель из массива или декор из необработанной древесины добавляют пространству природной мягкости, а их текстура создает эффект рукотворности. Камень, будь то мраморная столешница на кухне или грубая плитка в ванной, привносит благородную прохладу, контрастируя с теплотой дерева. Эти материалы не просто эстетичны — они экологичны, долговечны и со временем лишь подчеркивают индивидуальность интерьера.', NULL, NULL, 0),
(65, 'article', 23, 'image', '', 'https://downloader.disk.yandex.ru/disk/ec241735e6db85afee7ec94e6b67ced393f98c3abfa8d484749f13e2c56c2016/6830f691/OUiJv7ajqdjilrmSHYmR96t1KTcClHA8cP_Za9nKAX60kqT7_rmsRvHS11NFhk5AihhZ6vsEmqW8RkPlQ3TNkQ%3D%3D?uid=0&filename=block1-kandinsky-download-1748024018859-91192768o.png&disposition=attachment&hash=TlVRM5TXB%2Bu6MdIE9tSYWVyBjyM2Md6u6bMJ0J79nNejlpW04GVm6lC0cFBodlfiq/J6bpmRyOJonT3VoXnDag%3D%3D%3A&limit=0&content_type=image%2Fpng&owner_uid=362045858&fsize=722889&hid=5b9b2c6bc004b9065c85060ece4b538e&media_type=image&tknv=v3', '', 1),
(66, 'article', 23, 'text', 'Текстиль играет ключевую роль в создании уюта. Льняные шторы, шерстяные пледы, хлопковые покрывала и ковры с высоким ворсом смягчают даже самые строгие интерьеры. Слоистость фактур — например, сочетание грубой мешковины с шелковистым бархатом — добавляет глубины и интимности. Не стоит забывать и о коже: потертые кожаные кресла или диваны с годами приобретают благородный блеск, рассказывая историю дома. Важно, чтобы ткани были приятны на ощупь и функциональны: легко чистились, не накапливали пыль и сохраняли цвет даже при ярком солнечном свете.', NULL, NULL, 2),
(67, 'article', 23, 'image', '', 'https://downloader.disk.yandex.ru/disk/787208d86f263756747aa4536874e055fbb18c53f7363aaca8980830ac4250a7/6830f694/OUiJv7ajqdjilrmSHYmR93RLURu2ehRpUbobSMcOoIl-eJ8B8srps_l1-toCukfXKJd4XgteqTtuKxzrc-FNXQ%3D%3D?uid=0&filename=block3-kandinsky-download-1748024146018-914434wkz.png&disposition=attachment&hash=dLcPXdvc157PmKXsaAqW23dOzSPH8rCmV%2Bam%2BkQJDDymoz7dtu5Yza2jkazz4b2uq/J6bpmRyOJonT3VoXnDag%3D%3D%3A&limit=0&content_type=image%2Fpng&owner_uid=362045858&fsize=759890&hid=c2dcd7389ad5b9af1aa70b29672e7d0a&media_type=image&tknv=v3', '', 3),
(68, 'article', 23, 'text', 'Современные технологии и материалы тоже могут работать на уют, если их грамотно интегрировать. Например, кварцвиниловые полы, имитирующие дерево, сочетают в себе тепло натуральных материалов и устойчивость к влаге. Декоративные штукатурки с эффектом шелка или бетона визуально обволакивают стены, создавая мягкий фон для мебели. Даже металл, если использовать его дозированно, добавляет интерьеру характер: медные светильники, черные кованые ножки стола или латунные ручки на шкафах становятся изящными акцентами. Главное — сохранять баланс между холодными и теплыми фактурами, чтобы пространство не теряло душевности.', NULL, NULL, 4),
(69, 'article', 23, 'image', '', 'https://downloader.disk.yandex.ru/disk/6dd88208bd745a41413242f0f6737e6c3992985c9709e848cbd9d68eacfd6ce2/6830f696/OUiJv7ajqdjilrmSHYmR9yTPDoRYIfFMmggzMHYn5JcP-QMJbkOXDECjHnOHP50a0a5aggDSa5H-A_vaSBJ-rA%3D%3D?uid=0&filename=block5-kandinsky-download-1748024208948-916424lqh.png&disposition=attachment&hash=8x8Mxl48KvnUZBkxeU6zHvN1c4Hz3UuSrpb0QHjwQjz3qTYqhOWhnsVNYtFAomE9q/J6bpmRyOJonT3VoXnDag%3D%3D%3A&limit=0&content_type=image%2Fpng&owner_uid=362045858&fsize=605520&hid=ca74eb94b72bb63f08b6a7ddac359c58&media_type=image&tknv=v3', '', 5),
(70, 'article', 23, 'text', 'Уют рождается там, где материалы «говорят» на одном языке с жильцами. Это может быть запах дерева, шероховатость глиняной вазы или мягкость ковра под ногами — каждая деталь должна вызывать желание остаться дома чуть дольше. Выбирая материалы, стоит прислушаться не только к трендам, но и к своим ощущениям: интерьер, который хочется обнять взглядом, всегда начинается с искренности.', NULL, NULL, 6);

-- --------------------------------------------------------

--
-- Структура таблицы `images`
--

CREATE TABLE `images` (
  `id` int(11) NOT NULL,
  `url` text DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `direct_url` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `images`
--

INSERT INTO `images` (`id`, `url`, `alt_text`, `title`, `entity_type`, `entity_id`, `sort_order`, `direct_url`, `created_at`) VALUES
(1, 'https://2.downloader.disk.yandex.ru/preview/f7584118a519091c33aee6bb6bf7f90d927f930153350fb4ec612eb6cb6a5b79/inf/csS92L08iE085Ey_CPXkWRgEKObuq0EgBms7x-SCTbHiWvQkRLMgL6eFg9PWsUXaNWpKs_CpGOO-PSr3aAPJ2A%3D%3D?uid=362045858&filename=0000_%D0%A4%D0%B0%D1%81%D0%B0%D0%B4.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '0000_Фасад.JPG', 'Слайдер на главной 1', 'slider', 1, 0, 'https://2.downloader.disk.yandex.ru/preview/f7584118a519091c33aee6bb6bf7f90d927f930153350fb4ec612eb6cb6a5b79/inf/csS92L08iE085Ey_CPXkWRgEKObuq0EgBms7x-SCTbHiWvQkRLMgL6eFg9PWsUXaNWpKs_CpGOO-PSr3aAPJ2A%3D%3D?uid=362045858&filename=0000_%D0%A4%D0%B0%D1%81%D0%B0%D0%B4.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(2, 'https://4.downloader.disk.yandex.ru/preview/6af7c82aeb55b1fcb6321ec2bfdd96224b34da1a76abecf535e501a2d13e92ec/inf/XSNTnQFkxdZ0avn70rNhqDDCL3x3CgQYMQ05S5Drgpl_RclmHHyomAMvoqHG_l0AZ78-00LUW2HPwmW0L5TElQ%3D%3D?uid=362045858&filename=0006_%D0%B3%D1%81%D1%82.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '012_гостиная.jpg', 'Слайдер на главной 2', 'slider', 1, 1, 'https://4.downloader.disk.yandex.ru/preview/6af7c82aeb55b1fcb6321ec2bfdd96224b34da1a76abecf535e501a2d13e92ec/inf/XSNTnQFkxdZ0avn70rNhqDDCL3x3CgQYMQ05S5Drgpl_RclmHHyomAMvoqHG_l0AZ78-00LUW2HPwmW0L5TElQ%3D%3D?uid=362045858&filename=0006_%D0%B3%D1%81%D1%82.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(3, 'https://4.downloader.disk.yandex.ru/preview/cda6c686bf530c27507a536800a45f50a528079dcbc89d60efeb1d3a74002fad/inf/V-WVMIQqXhW4n1MmJVWTo0hM-jZDJxvFWcm3bJj3F0vOCsjOc6RfcE5UfeUgzyZGLZ-ht-olapqTYb2R7LlM_w%3D%3D?uid=362045858&filename=005_%D0%B3%D0%BE%D1%81%D1%82%D0%B8%D0%BD%D0%B0%D1%8F_05.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '005_гостиная_05.jpg', 'Слайдер на главной 3', 'slider', 1, 2, 'https://4.downloader.disk.yandex.ru/preview/cda6c686bf530c27507a536800a45f50a528079dcbc89d60efeb1d3a74002fad/inf/V-WVMIQqXhW4n1MmJVWTo0hM-jZDJxvFWcm3bJj3F0vOCsjOc6RfcE5UfeUgzyZGLZ-ht-olapqTYb2R7LlM_w%3D%3D?uid=362045858&filename=005_%D0%B3%D0%BE%D1%81%D1%82%D0%B8%D0%BD%D0%B0%D1%8F_05.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(4, 'https://2.downloader.disk.yandex.ru/preview/5b530ab6e0c79690c6b64542755e0a7ba83c2a3c2c06de65730c0ac92a3dbae0/inf/r3IZaOk1yLJCjwAcgdGTOhLWN35A83KPo6U53GdN48lP0YJ9uKsJRy5XP6VnRx5FuTXXTkil1fd8qDSMXm58cA%3D%3D?uid=362045858&filename=00_%D0%94%D0%BE%D0%BC_%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%BE%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'house.JPG', 'Слайдер на главной 4', 'slider', 1, 3, 'https://2.downloader.disk.yandex.ru/preview/5b530ab6e0c79690c6b64542755e0a7ba83c2a3c2c06de65730c0ac92a3dbae0/inf/r3IZaOk1yLJCjwAcgdGTOhLWN35A83KPo6U53GdN48lP0YJ9uKsJRy5XP6VnRx5FuTXXTkil1fd8qDSMXm58cA%3D%3D?uid=362045858&filename=00_%D0%94%D0%BE%D0%BC_%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%BE%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(5, 'https://2.downloader.disk.yandex.ru/preview/1b9a9be9363c2e19ec0f93e61203b612249427ec4fbd48461f3a46babefb25f4/inf/xk6R46HPfDCxh9Qqm-DAIzuB26EwTl53Pco1ZVfF3bvXqkyDD3cXUWwKqLMpPb0lVWVk63nK9xVJZv5LJ4iBeg%3D%3D?uid=362045858&filename=00_%D0%94%D0%BE%D0%BC_%D0%9A%D0%BB%D1%83%D0%B120%2771.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '00_Дом_Клуб20\'71.jpg', 'Слайдер на главной 5', 'slider', 1, 4, 'https://2.downloader.disk.yandex.ru/preview/1b9a9be9363c2e19ec0f93e61203b612249427ec4fbd48461f3a46babefb25f4/inf/xk6R46HPfDCxh9Qqm-DAIzuB26EwTl53Pco1ZVfF3bvXqkyDD3cXUWwKqLMpPb0lVWVk63nK9xVJZv5LJ4iBeg%3D%3D?uid=362045858&filename=00_%D0%94%D0%BE%D0%BC_%D0%9A%D0%BB%D1%83%D0%B120%2771.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(6, 'https://2.downloader.disk.yandex.ru/preview/97b7d862eccb0236a4769604c4bd000369a238196844a05d27f4c2ca9d0eb404/inf/400cVZVJ_vvVlu2xysTOXn3cAUgLePBzP4oZDGXPtd1Y7Gutspnm56ugQYuYykHbP9TTCREDF6GW_af5JuEpdg%3D%3D?uid=362045858&filename=012_%D0%B3%D0%BE%D1%81%D1%82%D0%B8%D0%BD%D0%B0%D1%8F.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '012_гостиная.jpg', 'Слайдер на главной 6', 'slider', 1, 5, 'https://2.downloader.disk.yandex.ru/preview/97b7d862eccb0236a4769604c4bd000369a238196844a05d27f4c2ca9d0eb404/inf/400cVZVJ_vvVlu2xysTOXn3cAUgLePBzP4oZDGXPtd1Y7Gutspnm56ugQYuYykHbP9TTCREDF6GW_af5JuEpdg%3D%3D?uid=362045858&filename=012_%D0%B3%D0%BE%D1%81%D1%82%D0%B8%D0%BD%D0%B0%D1%8F.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(7, 'https://3.downloader.disk.yandex.ru/preview/0e4bdce3b189ae9178295bddecb8f4cc1b6f4720515d4ea53d1d4ba240a1629f/inf/NhZkHay6FqgjXCx-0gm56GzJUgtka_P8NE0I7KIR-DbAsSWh0bKZP8gzD798ToaRLfCuwJl6tNppgGcGg9fgnw%3D%3D?uid=362045858&filename=IMG_3956.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'IMG_3956.JPG', 'Слайдер на главной 7', 'slider', 1, 6, 'https://3.downloader.disk.yandex.ru/preview/0e4bdce3b189ae9178295bddecb8f4cc1b6f4720515d4ea53d1d4ba240a1629f/inf/NhZkHay6FqgjXCx-0gm56GzJUgtka_P8NE0I7KIR-DbAsSWh0bKZP8gzD798ToaRLfCuwJl6tNppgGcGg9fgnw%3D%3D?uid=362045858&filename=IMG_3956.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-22 18:22:11'),
(8, 'https://2.downloader.disk.yandex.ru/preview/fd3f6526046d85c03d095a5962afd4166e1a4eb245d35f9b542c3fe34fef5ca9/inf/400cVZVJ_vvVlu2xysTOXn3cAUgLePBzP4oZDGXPtd1Y7Gutspnm56ugQYuYykHbP9TTCREDF6GW_af5JuEpdg%3D%3D?uid=362045858&filename=flat.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Современная квартира', 'Жилые интерьеры', 'case', 1, 1, 'https://2.downloader.disk.yandex.ru/preview/fd3f6526046d85c03d095a5962afd4166e1a4eb245d35f9b542c3fe34fef5ca9/inf/400cVZVJ_vvVlu2xysTOXn3cAUgLePBzP4oZDGXPtd1Y7Gutspnm56ugQYuYykHbP9TTCREDF6GW_af5JuEpdg%3D%3D?uid=362045858&filename=flat.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 20:12:42'),
(9, 'https://4.downloader.disk.yandex.ru/preview/e4ba8f2c3bad42b906b1c5befcf9a53815b4da3394e2dbe50fa9d934fdbb9aad/inf/WVILNekVvHypyKKvEq8bVtIqtYcojPZffVU_dhy9Z84hZhfm_Ry8_ZlK5XJLJcFnMT-uSUryDgOFYXNOZVAqbA%3D%3D?uid=362045858&filename=house.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Загородный дом', 'Загородные дома', 'case', 2, 2, 'https://4.downloader.disk.yandex.ru/preview/e4ba8f2c3bad42b906b1c5befcf9a53815b4da3394e2dbe50fa9d934fdbb9aad/inf/WVILNekVvHypyKKvEq8bVtIqtYcojPZffVU_dhy9Z84hZhfm_Ry8_ZlK5XJLJcFnMT-uSUryDgOFYXNOZVAqbA%3D%3D?uid=362045858&filename=house.JPG&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 20:12:42'),
(10, 'https://3.downloader.disk.yandex.ru/preview/a35a172de99cb36a6fb8a207316dafcade00d017289734f9bb36a778c0d34f45/inf/kCgTEGb_Nboi8QB15FJzG0PIeDwKGi8FuN77Y71kKVriVlyYr8xSi1zX8ERImqmEJ9Ud7846W3SzHVIEVjJ3vA%3D%3D?uid=362045858&filename=office.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1280x863', 'Современный офис', 'Офисные интерьеры', 'case', 3, 3, 'https://3.downloader.disk.yandex.ru/preview/a35a172de99cb36a6fb8a207316dafcade00d017289734f9bb36a778c0d34f45/inf/kCgTEGb_Nboi8QB15FJzG0PIeDwKGi8FuN77Y71kKVriVlyYr8xSi1zX8ERImqmEJ9Ud7846W3SzHVIEVjJ3vA%3D%3D?uid=362045858&filename=office.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1280x863', '2025-05-23 20:12:43'),
(11, 'https://2.downloader.disk.yandex.ru/preview/f146203b466f132952b3b03d5653058923bec51fc617f9d6cf213b4555061d63/inf/8SgumCZERb212BR3nRFxqi8J22YXXc9rA6PRrLv2GKdrKwGtVR9PkyD_gl7W2NRxBvq-deSFvjgyQfqwaZ64CA%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%92%D0%B5%D0%BA%D1%88%D0%B8%D0%BD%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в КП Векшино.jpg', 'Дом в КП Векшино', 'houses', 2, 0, 'https://2.downloader.disk.yandex.ru/preview/f146203b466f132952b3b03d5653058923bec51fc617f9d6cf213b4555061d63/inf/8SgumCZERb212BR3nRFxqi8J22YXXc9rA6PRrLv2GKdrKwGtVR9PkyD_gl7W2NRxBvq-deSFvjgyQfqwaZ64CA%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%92%D0%B5%D0%BA%D1%88%D0%B8%D0%BD%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:02'),
(12, 'https://4.downloader.disk.yandex.ru/preview/c1bf77e1294bf10cd7dd3dc2081f388b6cfe7b77aa65ea390fdbcf086bf48ce3/inf/xW0izTzUI30my_webWqamM7cvrZbSZWK-JnH8Nccnmr28O_9fy3ZDeFzoAtZaS3jJjsZ08qUE1dqAqA5T1a5JQ%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%9A%D0%BB%D1%83%D0%B1%2020%E2%80%9971.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в КП Клуб 20’71.jpg', 'Дом в КП Клуб 20’71', 'houses', 2, 0, 'https://4.downloader.disk.yandex.ru/preview/c1bf77e1294bf10cd7dd3dc2081f388b6cfe7b77aa65ea390fdbcf086bf48ce3/inf/xW0izTzUI30my_webWqamM7cvrZbSZWK-JnH8Nccnmr28O_9fy3ZDeFzoAtZaS3jJjsZ08qUE1dqAqA5T1a5JQ%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%9A%D0%BB%D1%83%D0%B1%2020%E2%80%9971.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:03'),
(13, 'https://2.downloader.disk.yandex.ru/preview/bf29bc4524556b8d0267521c0fe5ff4791d443261449311aeea1529edbe765d2/inf/0yohVIZPHerCw9FdZwoSbLhc5w13PjZQVsMIJz-SziS6dtniTNjPtZ9z1MkCoZ8biJdcKN-A59ufO-1FxoEV9g%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%9C%D0%B0%D1%80%D1%82%D0%B5%D0%BC%D1%8C%D1%8F%D0%BD%D0%BE%D0%B2%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в КП Мартемьяново.jpg', 'Дом в КП Мартемьяново', 'houses', 2, 0, 'https://2.downloader.disk.yandex.ru/preview/bf29bc4524556b8d0267521c0fe5ff4791d443261449311aeea1529edbe765d2/inf/0yohVIZPHerCw9FdZwoSbLhc5w13PjZQVsMIJz-SziS6dtniTNjPtZ9z1MkCoZ8biJdcKN-A59ufO-1FxoEV9g%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%9C%D0%B0%D1%80%D1%82%D0%B5%D0%BC%D1%8C%D1%8F%D0%BD%D0%BE%D0%B2%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:04'),
(14, 'https://4.downloader.disk.yandex.ru/preview/53ee594fcdc2e67df30ae93a7e52cea6a5d740904b9c0bbc5938f4190b338083/inf/h1SVKSpYeD05PZ3bVv3PmM7cvrZbSZWK-JnH8NccnmrViDzOgBJzvG1rx85xziSNCVmlM2f8KrP-0w3Zv0zk_g%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%9E%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в КП Третья Охота.jpg', 'Дом в КП Третья Охота', 'houses', 2, 0, 'https://4.downloader.disk.yandex.ru/preview/53ee594fcdc2e67df30ae93a7e52cea6a5d740904b9c0bbc5938f4190b338083/inf/h1SVKSpYeD05PZ3bVv3PmM7cvrZbSZWK-JnH8NccnmrViDzOgBJzvG1rx85xziSNCVmlM2f8KrP-0w3Zv0zk_g%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%9E%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:05'),
(15, 'https://1.downloader.disk.yandex.ru/preview/42c44611aefdff90bbb8e25dcc9bbb4a895385cfaecabd09172d9314c314ff7c/inf/sMVbSoni0qrMgGWehWrxs7eDrGsI9lL64dOUcViKkIpS3I2CVbmWMf2WseH_Tt2aj1onVyUw-35UScs9U9wFcQ%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9F%D0%BE%D1%81%D0%B5%D0%BB%D0%BA%D0%B5%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BE-%D0%94%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в Поселке Петрово-Дальнее.jpg', 'Дом в Поселке Петрово-Дальнее', 'houses', 2, 0, 'https://1.downloader.disk.yandex.ru/preview/42c44611aefdff90bbb8e25dcc9bbb4a895385cfaecabd09172d9314c314ff7c/inf/sMVbSoni0qrMgGWehWrxs7eDrGsI9lL64dOUcViKkIpS3I2CVbmWMf2WseH_Tt2aj1onVyUw-35UScs9U9wFcQ%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%9F%D0%BE%D1%81%D0%B5%D0%BB%D0%BA%D0%B5%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BE-%D0%94%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:06'),
(16, 'https://3.downloader.disk.yandex.ru/preview/b53aff8406d9a0b6416658c40aa7e2464194dbf8165ed1ee13b19bef622ba1cb/inf/iOONcuumBf2yv2lxxwIjKrhc5w13PjZQVsMIJz-SziTqorechwOPbMsoey7-PvA7JkcogYOwXAXsMmxdYxmkyg%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D0%B5%20%D0%9C%D1%8B%D1%88%D0%B5%D1%86%D0%BA%D0%BE%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в деревне Мышецкое.jpg', 'Дом в деревне Мышецкое', 'houses', 2, 0, 'https://downloader.disk.yandex.ru/disk/c6334eb2fb56d9b8a26d14974cf84fbf678f88fa52d39973d3a371fbeaffd678/68312556/OUiJv7ajqdjilrmSHYmR923u1tRrFBpf3jl596e0ZAFnoZHSNFq9Ga1Mqle8n70lOpPiyV-oZ7aWr1i3IYgr9g%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%B4%D0%B5%D1%80%D0%B5%D0%B2%D0%BD%D0%B5%20%D0%9C%D1%8B%D1%88%D0%B5%D1%86%D0%BA%D0%BE%D0%B5.jpg&disposition=attachment&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&fsize=46124&hid=27487e3ab95724edd0dae0ab4ef4e415&media_type=image&tknv=v3&etag=e4f19053332d203ff95872a6a3b7be8c', '2025-05-23 21:48:06'),
(17, 'https://1.downloader.disk.yandex.ru/preview/227ec45e91429bb8abb02acad2107bdc513cce874f9c3c62c8c791f818d663ff/inf/D7hezzejLW_G0gB6I73pdreDrGsI9lL64dOUcViKkIqZOAh3bC6wWKoan5PPORC-YmnCRDDtLkKmLNiMCQ3qrA%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%BF%D0%BE%D1%81%D0%B5%D0%BB%D0%BA%D0%B5%20%E2%80%9C%D0%98%D1%81%D1%82%D1%80%D0%B0%20%D0%9A%D0%B0%D0%BD%D1%82%D1%80%D0%B8%20%D0%9A%D0%BB%D0%B0%D0%B1%E2%80%9D.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Дом в поселке “Истра Кантри Клаб”.jpg', 'Дом в поселке “Истра Кантри Клаб”', 'houses', 2, 0, 'https://1.downloader.disk.yandex.ru/preview/227ec45e91429bb8abb02acad2107bdc513cce874f9c3c62c8c791f818d663ff/inf/D7hezzejLW_G0gB6I73pdreDrGsI9lL64dOUcViKkIqZOAh3bC6wWKoan5PPORC-YmnCRDDtLkKmLNiMCQ3qrA%3D%3D?uid=362045858&filename=%D0%94%D0%BE%D0%BC%20%D0%B2%20%D0%BF%D0%BE%D1%81%D0%B5%D0%BB%D0%BA%D0%B5%20%E2%80%9C%D0%98%D1%81%D1%82%D1%80%D0%B0%20%D0%9A%D0%B0%D0%BD%D1%82%D1%80%D0%B8%20%D0%9A%D0%BB%D0%B0%D0%B1%E2%80%9D.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:07'),
(18, 'https://3.downloader.disk.yandex.ru/preview/624c4234da1d5e921ff97483e9c8880717571978a9b308b105198f6d91ab4abf/inf/6lbOsu99lBMDm0w0lIolHS8J22YXXc9rA6PRrLv2GKe4VZMKq7-Pk1mjfSTRZeNwjFm9n5R1ZYKL2lQhnLz62Q%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%94%D0%BE%D0%BC%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%9A%D0%BB%D1%83%D0%B1%2020%E2%80%9971.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Интерьеры Дома в КП Клуб 20’71.jpg', 'Интерьеры Дома в КП Клуб 20’71', 'apartments', 1, 0, 'https://3.downloader.disk.yandex.ru/preview/624c4234da1d5e921ff97483e9c8880717571978a9b308b105198f6d91ab4abf/inf/6lbOsu99lBMDm0w0lIolHS8J22YXXc9rA6PRrLv2GKe4VZMKq7-Pk1mjfSTRZeNwjFm9n5R1ZYKL2lQhnLz62Q%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%94%D0%BE%D0%BC%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%9A%D0%BB%D1%83%D0%B1%2020%E2%80%9971.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:08'),
(19, 'https://1.downloader.disk.yandex.ru/preview/1150bd737b8e004a0e02c834416b4ef8fe3362518dd23f45c1c3ed4b2534aa6d/inf/SemqoE-VqUE4sPiZ2dFwWbhc5w13PjZQVsMIJz-SziT4yy34tkKX7BrnbBIclo0lOSlC_ONYaS_CLNK-i4NjsA%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%B4%D0%BE%D0%BC%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%9E%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Интерьеры дома в КП Третья Охота.jpg', 'Интерьеры дома в КП Третья Охота', 'apartments', 1, 0, 'https://1.downloader.disk.yandex.ru/preview/1150bd737b8e004a0e02c834416b4ef8fe3362518dd23f45c1c3ed4b2534aa6d/inf/SemqoE-VqUE4sPiZ2dFwWbhc5w13PjZQVsMIJz-SziT4yy34tkKX7BrnbBIclo0lOSlC_ONYaS_CLNK-i4NjsA%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%B4%D0%BE%D0%BC%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%A2%D1%80%D0%B5%D1%82%D1%8C%D1%8F%20%D0%9E%D1%85%D0%BE%D1%82%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:09'),
(20, 'https://3.downloader.disk.yandex.ru/preview/54d11216a707c771d6728af1f960c76bb8ae9469cef68426c022e6721f26e583/inf/gIVofEerUGoUyT9bf6HXyi8J22YXXc9rA6PRrLv2GKfVJyOPrwIpwPPfYAZA-x8OqbM0W89SxCG8FDpU1O0Wwg%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B%20%D0%B2%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BE-%D0%94%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%BC.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Интерьеры квартиры в Петрово-Дальнем.jpg', 'Интерьеры квартиры в Петрово-Дальнем', 'apartments', 1, 0, 'https://3.downloader.disk.yandex.ru/preview/54d11216a707c771d6728af1f960c76bb8ae9469cef68426c022e6721f26e583/inf/gIVofEerUGoUyT9bf6HXyi8J22YXXc9rA6PRrLv2GKfVJyOPrwIpwPPfYAZA-x8OqbM0W89SxCG8FDpU1O0Wwg%3D%3D?uid=362045858&filename=%D0%98%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D1%8B%20%D0%B2%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BE-%D0%94%D0%B0%D0%BB%D1%8C%D0%BD%D0%B5%D0%BC.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:10'),
(21, 'https://3.downloader.disk.yandex.ru/preview/a383f64d6c1d4188b1e5259aaf7efac4f8d314c3902218a2731f0598f49885b8/inf/lY-0n22se-va83Wu0qR7qOlpKFAHHii87PUOmESeNRNT2YbwvuTsOyK3un3lAl8xkpH7byseHKVcqNEhPYdkLA%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20Loft%20Garden.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Loft Garden.jpg', 'Кв-ра в ЖК Loft Garden', 'apartments', 1, 0, 'https://3.downloader.disk.yandex.ru/preview/a383f64d6c1d4188b1e5259aaf7efac4f8d314c3902218a2731f0598f49885b8/inf/lY-0n22se-va83Wu0qR7qOlpKFAHHii87PUOmESeNRNT2YbwvuTsOyK3un3lAl8xkpH7byseHKVcqNEhPYdkLA%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20Loft%20Garden.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:10'),
(22, 'https://3.downloader.disk.yandex.ru/preview/7619efbe1e1abe8fe7bab39a6b8df97de06830e5beeeb37c995f93a326182bee/inf/t05QSAa93lwNK4-8M1h5Di8J22YXXc9rA6PRrLv2GKeG-GIGB144Rd4rYszDqz5vhZJ5ZsCactV-IAn6IXCvIg%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%C2%AB%D0%90%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B0%D0%BB%C2%BB.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК «Английский квартал».jpg', 'Кв-ра в ЖК «Английский квартал»', 'apartments', 1, 0, 'https://3.downloader.disk.yandex.ru/preview/7619efbe1e1abe8fe7bab39a6b8df97de06830e5beeeb37c995f93a326182bee/inf/t05QSAa93lwNK4-8M1h5Di8J22YXXc9rA6PRrLv2GKeG-GIGB144Rd4rYszDqz5vhZJ5ZsCactV-IAn6IXCvIg%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%C2%AB%D0%90%D0%BD%D0%B3%D0%BB%D0%B8%D0%B9%D1%81%D0%BA%D0%B8%D0%B9%20%D0%BA%D0%B2%D0%B0%D1%80%D1%82%D0%B0%D0%BB%C2%BB.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:11'),
(23, 'https://1.downloader.disk.yandex.ru/preview/2222dcab0f1a58711da23f3b0a9e7e1e6c29b961b1149ed1235acf2329ebeb44/inf/WPvvQqn-bwL_jvgOE4plmy8J22YXXc9rA6PRrLv2GKdIF7JBc6rFMYXzV89TJBuVTa7vrGVjG4Fz0Z54VV3iJg%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%9A%D0%BE%D0%BD%D0%B5%D0%B2%D0%B0%2014.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Конева 14.jpg', 'Кв-ра в ЖК Конева 14', 'apartments', 1, 0, 'https://1.downloader.disk.yandex.ru/preview/2222dcab0f1a58711da23f3b0a9e7e1e6c29b961b1149ed1235acf2329ebeb44/inf/WPvvQqn-bwL_jvgOE4plmy8J22YXXc9rA6PRrLv2GKdIF7JBc6rFMYXzV89TJBuVTa7vrGVjG4Fz0Z54VV3iJg%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%9A%D0%BE%D0%BD%D0%B5%D0%B2%D0%B0%2014.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:12'),
(24, 'https://1.downloader.disk.yandex.ru/preview/fead5a3b2ead03509e938901517f1fcb585dadb1318e2f759d170d618890e094/inf/Cm3XuAJdGiOgKons71TE_beDrGsI9lL64dOUcViKkIquWFdwyPR57vGvYlL0WGyqwcN9WT3XWVGuuMIAzCOObQ%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%9A%D0%BE%D0%BD%D1%82%D0%B8%D0%BD%D0%B5%D0%BD%D1%82%D0%B0%D0%BB%D1%8C.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Континенталь.jpg', 'Кв-ра в ЖК Континенталь', 'apartments', 1, 0, 'https://1.downloader.disk.yandex.ru/preview/fead5a3b2ead03509e938901517f1fcb585dadb1318e2f759d170d618890e094/inf/Cm3XuAJdGiOgKons71TE_beDrGsI9lL64dOUcViKkIquWFdwyPR57vGvYlL0WGyqwcN9WT3XWVGuuMIAzCOObQ%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%9A%D0%BE%D0%BD%D1%82%D0%B8%D0%BD%D0%B5%D0%BD%D1%82%D0%B0%D0%BB%D1%8C.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:13'),
(25, 'https://4.downloader.disk.yandex.ru/preview/88cd9673ab0ab51701566a7f50e4279c604518d3bc4b60218db500ee76fd1949/inf/NC8VQkWDW07587dYCjIk7SmngTcRy4k91upAGpztJmfU0eI9wkNaLhn-Ulk2CvXZvz482QnKO5W-An2liIHjjQ%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A1%D0%B5%D0%B4%D1%8C%D0%BC%D0%BE%D0%B5%20%D0%BD%D0%B5%D0%B1%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Седьмое небо.jpg', 'Кв-ра в ЖК Седьмое небо', 'apartments', 1, 0, 'https://4.downloader.disk.yandex.ru/preview/88cd9673ab0ab51701566a7f50e4279c604518d3bc4b60218db500ee76fd1949/inf/NC8VQkWDW07587dYCjIk7SmngTcRy4k91upAGpztJmfU0eI9wkNaLhn-Ulk2CvXZvz482QnKO5W-An2liIHjjQ%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A1%D0%B5%D0%B4%D1%8C%D0%BC%D0%BE%D0%B5%20%D0%BD%D0%B5%D0%B1%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:14'),
(26, 'https://1.downloader.disk.yandex.ru/preview/81b990689019b1f219d904399e959749359c5cb7823ea4f81753a8457f202b0c/inf/86iwFRoUZ3SXutJOeh_9TdeDnQaxXhEUjvRYa8jbj-jdM6cCzRU_OW6RejHFnyVcZLauSo23ViQqvVHYmsDRaw%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A4%D0%B5%D0%BB%D0%BB%D0%B8%D0%BD%D0%B8%2C%20%D0%B3.%20%D0%93%D0%B5%D0%BB%D0%B5%D0%BD%D0%B4%D0%B6%D0%B8%D0%BA.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Феллини, г. Геленджик.jpg', 'Кв-ра в ЖК Феллини, г. Геленджик', 'apartments', 1, 0, 'https://1.downloader.disk.yandex.ru/preview/81b990689019b1f219d904399e959749359c5cb7823ea4f81753a8457f202b0c/inf/86iwFRoUZ3SXutJOeh_9TdeDnQaxXhEUjvRYa8jbj-jdM6cCzRU_OW6RejHFnyVcZLauSo23ViQqvVHYmsDRaw%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A4%D0%B5%D0%BB%D0%BB%D0%B8%D0%BD%D0%B8%2C%20%D0%B3.%20%D0%93%D0%B5%D0%BB%D0%B5%D0%BD%D0%B4%D0%B6%D0%B8%D0%BA.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:14'),
(27, 'https://4.downloader.disk.yandex.ru/preview/8f1b6dcc67700b17cd501c96ba5fc3a57c06279c344d44b9629e49288db93d9e/inf/Fx34olxgS440vF6sJL1Rci8J22YXXc9rA6PRrLv2GKfw5D9PlW-IX2IIOsVRFGtmljDbgGyNsipP0f4n973-0A%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A8%D0%B0%D1%82%D0%B5%D1%80.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра в ЖК Шатер.jpg', 'Кв-ра в ЖК Шатер', 'apartments', 1, 0, 'https://4.downloader.disk.yandex.ru/preview/8f1b6dcc67700b17cd501c96ba5fc3a57c06279c344d44b9629e49288db93d9e/inf/Fx34olxgS440vF6sJL1Rci8J22YXXc9rA6PRrLv2GKfw5D9PlW-IX2IIOsVRFGtmljDbgGyNsipP0f4n973-0A%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%B2%20%D0%96%D0%9A%20%D0%A8%D0%B0%D1%82%D0%B5%D1%80.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:15'),
(28, 'https://4.downloader.disk.yandex.ru/preview/c572bf51610d60347cd72cf3c415537b8839c30c60f5ffaa0b84126ac30d52ad/inf/lbIkHSastbYlsarV2ZNBkelpKFAHHii87PUOmESeNRNyxurTjYokl9yRsvdq7xmKw3fyUITbVSTorhddokFcAA%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%BD%D0%B0%20%D1%83%D0%BB%20%D0%94%D0%B5%D0%BC%D1%8C%D1%8F%D0%BD%D0%B0%20%D0%91%D0%B5%D0%B4%D0%BD%D0%BE%D0%B3%D0%BE%2015.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра на ул Демьяна Бедного 15.jpg', 'Кв-ра на ул Демьяна Бедного 15', 'apartments', 1, 0, 'https://4.downloader.disk.yandex.ru/preview/c572bf51610d60347cd72cf3c415537b8839c30c60f5ffaa0b84126ac30d52ad/inf/lbIkHSastbYlsarV2ZNBkelpKFAHHii87PUOmESeNRNyxurTjYokl9yRsvdq7xmKw3fyUITbVSTorhddokFcAA%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%BD%D0%B0%20%D1%83%D0%BB%20%D0%94%D0%B5%D0%BC%D1%8C%D1%8F%D0%BD%D0%B0%20%D0%91%D0%B5%D0%B4%D0%BD%D0%BE%D0%B3%D0%BE%2015.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:17'),
(29, 'https://2.downloader.disk.yandex.ru/preview/7c782a18cdd9105ab468aa05728ff019112731ba3d396ce6b556ba09a8ef3e24/inf/QnFH-Y01lpekfSMtXiZueC8J22YXXc9rA6PRrLv2GKdsb9h1CDk93UbWWRTB3QMxFH-WHmN3qNO97H6WzPVQ2g%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%BD%D0%B0%20%D1%83%D0%BB%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BA%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Кв-ра на ул Петровка.jpg', 'Кв-ра на ул Петровка', 'apartments', 1, 0, 'https://2.downloader.disk.yandex.ru/preview/7c782a18cdd9105ab468aa05728ff019112731ba3d396ce6b556ba09a8ef3e24/inf/QnFH-Y01lpekfSMtXiZueC8J22YXXc9rA6PRrLv2GKdsb9h1CDk93UbWWRTB3QMxFH-WHmN3qNO97H6WzPVQ2g%3D%3D?uid=362045858&filename=%D0%9A%D0%B2-%D1%80%D0%B0%20%D0%BD%D0%B0%20%D1%83%D0%BB%20%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D0%B2%D0%BA%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:17'),
(30, 'https://3.downloader.disk.yandex.ru/preview/6ff5c1adcae9245a66156bc7f84c343a0b5a10dd13263817bdc1daac641bd88a/inf/YIgJLdR3Bncyswz8fJSwdy8J22YXXc9rA6PRrLv2GKfFSpqNDdbTQuzqqvku8Cw_hnudn-JM2JKCfKDJmdrpCg%3D%3D?uid=362045858&filename=%D0%9C%D0%B0%D0%BD%D1%81%D0%B0%D1%80%D0%B4%D0%B0%20%D0%B2%20%D0%B7%D0%B0%D0%B3%D0%BE%D1%80%D0%BE%D0%B4%D0%BD%D0%BE%D0%BC%20%D0%B6%D0%B8%D0%BB%D0%BE%D0%BC%20%D0%B4%D0%BE%D0%BC%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', 'Мансарда в загородном жилом доме.jpg', 'Мансарда в загородном жилом доме', 'apartments', 2, 0, 'https://3.downloader.disk.yandex.ru/preview/6ff5c1adcae9245a66156bc7f84c343a0b5a10dd13263817bdc1daac641bd88a/inf/YIgJLdR3Bncyswz8fJSwdy8J22YXXc9rA6PRrLv2GKfFSpqNDdbTQuzqqvku8Cw_hnudn-JM2JKCfKDJmdrpCg%3D%3D?uid=362045858&filename=%D0%9C%D0%B0%D0%BD%D1%81%D0%B0%D1%80%D0%B4%D0%B0%20%D0%B2%20%D0%B7%D0%B0%D0%B3%D0%BE%D1%80%D0%BE%D0%B4%D0%BD%D0%BE%D0%BC%20%D0%B6%D0%B8%D0%BB%D0%BE%D0%BC%20%D0%B4%D0%BE%D0%BC%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1905x919', '2025-05-23 21:48:18'),
(31, 'https://2.downloader.disk.yandex.ru/preview/1bf9b2f99095113c16342023698f6282d8d9f717d5bc27ca7a08f6f1729bf59e/inf/iXApLGVsnI5sqL69ORI45y8J22YXXc9rA6PRrLv2GKdLyyE2gT6kdfiwcXY5Leu0IglRz4FcppnvDqENi_NdlQ%3D%3D?uid=362045858&filename=%D0%9E%D1%82%D0%BA%D1%80%D1%8B%D1%82%D0%B0%D1%8F%20%D1%82%D0%B5%D1%80%D1%80%D0%B0%D1%81%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%9D%D0%BE%D0%B2%D0%B0%D0%BA%D0%BE%D0%B2%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Открытая терраса в КП Новаково.jpg', 'Открытая терраса в КП Новаково', 'houses', 2, 0, 'https://2.downloader.disk.yandex.ru/preview/1bf9b2f99095113c16342023698f6282d8d9f717d5bc27ca7a08f6f1729bf59e/inf/iXApLGVsnI5sqL69ORI45y8J22YXXc9rA6PRrLv2GKdLyyE2gT6kdfiwcXY5Leu0IglRz4FcppnvDqENi_NdlQ%3D%3D?uid=362045858&filename=%D0%9E%D1%82%D0%BA%D1%80%D1%8B%D1%82%D0%B0%D1%8F%20%D1%82%D0%B5%D1%80%D1%80%D0%B0%D1%81%D0%B0%20%D0%B2%20%D0%9A%D0%9F%20%D0%9D%D0%BE%D0%B2%D0%B0%D0%BA%D0%BE%D0%B2%D0%BE.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:09:25'),
(32, 'https://1.downloader.disk.yandex.ru/preview/742d2fdc72b9d7c3beebc588ae6dc015f903db15a541d9207787a928007bd6e2/inf/veNdC15bxEUTeTSmf-tSiS8J22YXXc9rA6PRrLv2GKdhcfwTn5-J69Amtvd2N9Po6mW57NkIZUjv0i95IHsd6w%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20Storm%20Properties%20%D0%B8%20%D0%BE%D1%84%D0%B8%D1%81%20%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%20%D0%91%D0%A6%20%D0%9A2.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Офис Storm Properties и офис продаж БЦ К2.jpg', 'Офис Storm Properties и офис продаж БЦ К2', 'offices', 3, 0, 'https://1.downloader.disk.yandex.ru/preview/742d2fdc72b9d7c3beebc588ae6dc015f903db15a541d9207787a928007bd6e2/inf/veNdC15bxEUTeTSmf-tSiS8J22YXXc9rA6PRrLv2GKdhcfwTn5-J69Amtvd2N9Po6mW57NkIZUjv0i95IHsd6w%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20Storm%20Properties%20%D0%B8%20%D0%BE%D1%84%D0%B8%D1%81%20%D0%BF%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%20%D0%91%D0%A6%20%D0%9A2.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:09:26'),
(33, 'https://3.downloader.disk.yandex.ru/preview/0c1a2eff14f29dfbadbfb29d78488facebcd291800f657ca0403bc5aa8cef01c/inf/hsyzyz4eck5vfk_Uw1Z69ymngTcRy4k91upAGpztJmeVk6rm-A4tkmDCyfuHPMOB1dBlgFh6y4n9XWkP3GuF6g%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20%D0%B2%20%D0%91%D0%A6%20%D0%9A%D0%B0%D0%BF%D0%B8%D1%82%D0%B0%D0%BB%20%D0%A2%D0%B0%D1%83%D1%8D%D1%80.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Офис в БЦ Капитал Тауэр.jpg', 'Офис в БЦ Капитал Тауэр', 'offices', 3, 0, 'https://3.downloader.disk.yandex.ru/preview/0c1a2eff14f29dfbadbfb29d78488facebcd291800f657ca0403bc5aa8cef01c/inf/hsyzyz4eck5vfk_Uw1Z69ymngTcRy4k91upAGpztJmeVk6rm-A4tkmDCyfuHPMOB1dBlgFh6y4n9XWkP3GuF6g%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20%D0%B2%20%D0%91%D0%A6%20%D0%9A%D0%B0%D0%BF%D0%B8%D1%82%D0%B0%D0%BB%20%D0%A2%D0%B0%D1%83%D1%8D%D1%80.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:09:27'),
(34, 'https://2.downloader.disk.yandex.ru/preview/58c682b14071f5aa23f8cd0b75a6cfc5b36200f551d12d8368fa2f1805e56b07/inf/wOGO1bD9ta1Djb_RTmyrCWL-7nePVZ3EmGwaAvy0SukEd_GB8TJkwuQwm4l9hKAhgUV6LwYsJjpXWy3y_45NVA%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20%D0%B2%20%D0%91%D0%A6%20%D0%B2%20%D0%9F%D1%83%D1%82%D0%B5%D0%B9%D1%81%D0%BA%D0%BE%D0%BC%20%D1%82%D1%83%D0%BF%D0%B8%D0%BA%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Офис в БЦ в Путейском тупике.jpg', 'Офис в БЦ в Путейском тупике', 'offices', 3, 0, 'https://2.downloader.disk.yandex.ru/preview/58c682b14071f5aa23f8cd0b75a6cfc5b36200f551d12d8368fa2f1805e56b07/inf/wOGO1bD9ta1Djb_RTmyrCWL-7nePVZ3EmGwaAvy0SukEd_GB8TJkwuQwm4l9hKAhgUV6LwYsJjpXWy3y_45NVA%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%20%D0%B2%20%D0%91%D0%A6%20%D0%B2%20%D0%9F%D1%83%D1%82%D0%B5%D0%B9%D1%81%D0%BA%D0%BE%D0%BC%20%D1%82%D1%83%D0%BF%D0%B8%D0%BA%D0%B5.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:09:28'),
(35, 'https://2.downloader.disk.yandex.ru/preview/c87a5d641f69af7f57e11cdbe80c4afbc50eff71b9f399d003c5b5e6de49e799/inf/pQ51OMSiBBg4r3fus3FtzSmngTcRy4k91upAGpztJmcQ-2i6UBKeFOwpEtYwXXX-6gF5zS5g7_8T21Yvc2cp3A%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%D0%BD%D1%8B%D0%B5%20%D0%B8%20%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5%20%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', 'Офисные и общественные интерьеры.jpg', 'Офисные и общественные интерьеры', 'offices', 3, 0, 'https://2.downloader.disk.yandex.ru/preview/c87a5d641f69af7f57e11cdbe80c4afbc50eff71b9f399d003c5b5e6de49e799/inf/pQ51OMSiBBg4r3fus3FtzSmngTcRy4k91upAGpztJmcQ-2i6UBKeFOwpEtYwXXX-6gF5zS5g7_8T21Yvc2cp3A%3D%3D?uid=362045858&filename=%D0%9E%D1%84%D0%B8%D1%81%D0%BD%D1%8B%D0%B5%20%D0%B8%20%D0%BE%D0%B1%D1%89%D0%B5%D1%81%D1%82%D0%B2%D0%B5%D0%BD%D0%BD%D1%8B%D0%B5%20%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D1%8C%D0%B5%D1%80%D1%8B.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:09:28'),
(36, 'https://downloader.disk.yandex.ru/disk/76b06c2f2ad26e0c9f1fa6f1149ba03bff5f6483459fab34bef97edbac34a2b2/68312e77/OUiJv7ajqdjilrmSHYmR9-_Y13ds2Szmp8iewCqyEehMRjXvKBeK_E_DpX6za2hikmZhqrtTHWa8w3V_Q9DHVQ%3D%3D?uid=362045858&filename=3d.jpg&disposition=attachment&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&fsize=793661&hid=35b99a1977cfb883672197b1666ac69a&media_type=image&tknv=v3&etag=3f0ec860a92848cbbe90b0dd3de46688', '3d.jpg', '3d', 'architecture', 101, 0, 'https://4.downloader.disk.yandex.ru/preview/ac9d52fecac485b834dccdc2325395bbccddd8fd778bc850c7955e95be942671/inf/gNYZphMyMTFNBS7JTnoowUcErw7YsFVyupgKI9d1jghqzbQ_ptxrDdWk_9C56b7odQetpVOcATOw5BO10q5gQQ%3D%3D?uid=362045858&filename=3d.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:27:04'),
(37, 'https://downloader.disk.yandex.ru/disk/1e5d9963a371f1f1988ed1d764a4eabdbf2e36769276e34e1181456aac6b165e/68312e78/OUiJv7ajqdjilrmSHYmR9-ANBpjHzfBHoH0rZLKQiYwMFOc8a7zSRuv-3B2Fx0Pauhgro-Fh1vrHL-fH0AbFHA%3D%3D?uid=362045858&filename=blueprint.jpg&disposition=attachment&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&fsize=1014027&hid=5af296de0105616ab18e8cb855981544&media_type=image&tknv=v3&etag=3aa9b4273277dde1e2ab35f932b6153f', 'blueprint.jpg', 'blueprint', 'architecture', 101, 0, 'https://1.downloader.disk.yandex.ru/preview/96e4bf7c9bf4318a0e2a2c79d51b699194c2353323f2402722720be435c09670/inf/cn1vvHIPnE32SXjo8f-Z0HBFgP32_iGWMuxJbMrkYNfjIt_tFpxTQR29GzTwxeasXhOx015hKSt1tNXHjto_8w%3D%3D?uid=362045858&filename=blueprint.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:27:04'),
(38, 'https://downloader.disk.yandex.ru/disk/70e9a13bf2216aa70ea651f6fed9a28c6c387d3880ae1548e3dc90b7d8f79771/68312e79/OUiJv7ajqdjilrmSHYmR9ymy8jqauKTuAN4bAtdnBN8GdTxW2r8Jd7sLiGbl-bjx15tpx9rudPgY5gcOehQweQ%3D%3D?uid=362045858&filename=landscape_design.jpg&disposition=attachment&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&fsize=450360&hid=69157e4c687660b502f1bd7433cbed46&media_type=image&tknv=v3&etag=5befc94a4e4ac833e8f4dd10fb8f51db', 'landscape_design.jpg', 'landscape design', 'architecture', 101, 0, 'https://4.downloader.disk.yandex.ru/preview/ea409375c0530623399c8ea45f76dd62ebd31911847ba224564775e5c8ad306b/inf/-JYlEI9KwaK1UML9pK-XQsDDiXs32xxY6gQHkMoobJ5qiwGljxBw0X5-v6miKmGefu9v5_YQx_llVXgyjPjK1A%3D%3D?uid=362045858&filename=landscape_design.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=362045858&tknv=v3&size=1920x919', '2025-05-23 22:27:05');

-- --------------------------------------------------------

--
-- Структура таблицы `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `project_type` enum('residential','country','office') DEFAULT NULL COMMENT 'Тип проекта: residential - Жилые интерьеры, country - Загородные дома, office - Офисные интерьеры',
  `path_to_file` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `year_completed` varchar(20) DEFAULT NULL,
  `area` decimal(10,2) DEFAULT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `design_assignment` text DEFAULT NULL,
  `planning_solution` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `projects`
--

INSERT INTO `projects` (`id`, `title`, `slug`, `description`, `project_type`, `path_to_file`, `location`, `year_completed`, `area`, `status`, `design_assignment`, `planning_solution`) VALUES
(3, 'Офис в Новахово', 'ofis-v-novahovo', 'Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там Чет там ', 'office', '/pic2/projects/project_3_test3/cover_-125784kte.jpg', 'Москва', '2025', 20.00, 'published', NULL, NULL),
(4, 'Коттедж в Истре', 'kottedzh-v-istre', 'Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик Домик домик домик ', 'country', '/pic2/projects/project_4_test4/cover_-325775e38.jpg', 'Москва ул. Щукинская', '2025', 4.00, 'published', NULL, NULL),
(10, 'Квартира на Щукинской', 'kvartira-na-schukinskoy', '1юфвылд воыыфл рмаволыфдфаушыщк щауцфшоывг ', 'residential', '/pic2/projects/project_10_test10/cover_03-9279357f5.jpg', 'Москва ул. Щукинская', '2025', 10.00, 'published', NULL, NULL),
(13, 'Офис тест 3', 'ofis-test-3', 'данные тест', 'office', '/pic2/projects/project_13_ofis_test_3/cover_va-00004-940108slr.jpg', 'Москва ул. Щукинская', '2025', 300.00, 'draft', '777', '888'),
(14, '1', '1', '1', NULL, '/pic2/projects/project_1751723760769_1/cover_01-760770xph.jpg', '1', '1', 1.00, 'draft', '1', '1'),
(15, '2', '2', '2', NULL, '/pic2/projects/project_1751724730838_2/cover_02-730839khi.jpg', '2', '2', 2.00, 'draft', '2', '2');

-- --------------------------------------------------------

--
-- Структура таблицы `project_architects`
--

CREATE TABLE `project_architects` (
  `project_id` int(11) NOT NULL,
  `architect_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `project_content_blocks`
--

CREATE TABLE `project_content_blocks` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `project_content_blocks`
--

INSERT INTO `project_content_blocks` (`id`, `project_id`, `block_type`, `content`, `image_path`, `image_path_2`, `image_alt`, `image_alt_2`, `caption`, `sort_order`, `created_at`, `updated_at`) VALUES
(108, 4, 'two_images', NULL, '/pic2/projects/project_4_test4/block_0_left_007-736177tt8.JPG', '/pic2/projects/project_4_test4/block_0_right_006-736178c1o.JPG', '11', '22', '11', 0, '2025-07-05 09:47:35', '2025-07-05 09:47:35'),
(109, 4, 'image_text', '44444444444444444444444444444', '/pic2/projects/project_4_test4/block_1_006-736190367.JPG', NULL, '1', NULL, '1', 1, '2025-07-05 09:47:35', '2025-07-05 09:47:35'),
(110, 4, 'text', 'Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация Важная информация ', NULL, NULL, NULL, NULL, NULL, 2, '2025-07-05 09:47:35', '2025-07-05 09:47:35'),
(115, 3, 'image_text', '77777777777777777777', '/pic2/projects/project_3_test3/block_0_005-779287d66.JPG', NULL, '777', NULL, '777', 0, '2025-07-05 10:12:56', '2025-07-05 10:12:56'),
(129, 10, 'text', 'Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста Много текста ', NULL, NULL, NULL, NULL, NULL, 0, '2025-07-05 10:30:22', '2025-07-05 10:30:22'),
(130, 10, 'two_images', NULL, '/pic2/projects/project_10_test10/block_1_left_001-3-927945v27.jpg', '/pic2/projects/project_10_test10/block_1_right_001-4-927946mv5.jpg', '1234', '4567', '1234', 1, '2025-07-05 10:30:22', '2025-07-05 10:30:22'),
(131, 10, 'image', NULL, '/pic2/projects/project_10_test10/block_2_04-927953pq2.jpg', NULL, '7777', NULL, '7777', 2, '2025-07-05 10:30:22', '2025-07-05 10:30:22'),
(132, 10, 'image_text', 'ваыпара аываав вывыаавы авыавыыва авыыав', '/pic2/projects/project_10_test10/block_3_001-4-9553286zx.jpg', NULL, '8888', NULL, '8888', 3, '2025-07-05 10:30:22', '2025-07-05 10:30:22'),
(137, 13, 'text', 'тест', NULL, NULL, NULL, NULL, NULL, 0, '2025-07-05 10:37:40', '2025-07-05 10:37:40');

-- --------------------------------------------------------

--
-- Структура таблицы `project_tags`
--

CREATE TABLE `project_tags` (
  `project_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `slug` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `architects`
--
ALTER TABLE `architects`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `articles`
--
ALTER TABLE `articles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Индексы таблицы `article_architects`
--
ALTER TABLE `article_architects`
  ADD PRIMARY KEY (`article_id`,`architect_id`),
  ADD KEY `architect_id` (`architect_id`);

--
-- Индексы таблицы `article_tags`
--
ALTER TABLE `article_tags`
  ADD PRIMARY KEY (`article_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Индексы таблицы `content_blocks`
--
ALTER TABLE `content_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`);

--
-- Индексы таблицы `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Индексы таблицы `project_architects`
--
ALTER TABLE `project_architects`
  ADD PRIMARY KEY (`project_id`,`architect_id`),
  ADD KEY `architect_id` (`architect_id`);

--
-- Индексы таблицы `project_content_blocks`
--
ALTER TABLE `project_content_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_content` (`project_id`,`sort_order`),
  ADD KEY `idx_block_type` (`block_type`);

--
-- Индексы таблицы `project_tags`
--
ALTER TABLE `project_tags`
  ADD PRIMARY KEY (`project_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Индексы таблицы `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `architects`
--
ALTER TABLE `architects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `articles`
--
ALTER TABLE `articles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT для таблицы `content_blocks`
--
ALTER TABLE `content_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT для таблицы `images`
--
ALTER TABLE `images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT для таблицы `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT для таблицы `project_content_blocks`
--
ALTER TABLE `project_content_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=138;

--
-- AUTO_INCREMENT для таблицы `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `article_architects`
--
ALTER TABLE `article_architects`
  ADD CONSTRAINT `article_architects_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_architects_ibfk_2` FOREIGN KEY (`architect_id`) REFERENCES `architects` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `article_tags`
--
ALTER TABLE `article_tags`
  ADD CONSTRAINT `article_tags_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `article_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `project_architects`
--
ALTER TABLE `project_architects`
  ADD CONSTRAINT `project_architects_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_architects_ibfk_2` FOREIGN KEY (`architect_id`) REFERENCES `architects` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `project_content_blocks`
--
ALTER TABLE `project_content_blocks`
  ADD CONSTRAINT `project_content_blocks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `project_tags`
--
ALTER TABLE `project_tags`
  ADD CONSTRAINT `project_tags_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
