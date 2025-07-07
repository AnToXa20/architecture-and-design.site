# Система управления статьями для архитектурного бюро

## Обзор системы

Полная система создания и управления статьями с:
- ✅ Загрузкой изображений на Яндекс Диск
- ✅ Сохранением в базу данных MySQL
- ✅ Поддержкой блоков контента (текст + изображения)
- ✅ Системой авторов из таблицы architects
- ✅ Интеграцией с админ панелью

## Файлы системы

### Новые файлы:
- `yandex-disk.js` - Модуль для работы с API Яндекс Диска
- `articles.js` - Сервис для обработки статей
- `update_articles_db.sql` - SQL скрипт обновления БД
- `test_db_update.js` - Скрипт для автоматического обновления БД

### Обновленные файлы:
- `server.js` - Добавлены новые API endpoints
- `admin.html` - Обновлена форма для работы с файлами

## Установка и настройка

### 1. Установка зависимостей
```bash
npm install axios form-data multer
```

### 2. Обновление базы данных
```bash
node test_db_update.js
```

Этот скрипт автоматически:
- Добавит новые столбцы в таблицу `articles`
- Обновит таблицу `content_blocks` для поддержки изображений
- Добавит тестовых архитекторов (если их нет)

### 3. Запуск сервера
```bash
node server.js
```

## Структура API

### POST /api/articles
Создание новой статьи с загрузкой файлов.

**Формат запроса:** `multipart/form-data`

**Поля:**
- `title` (string, обязательно) - Заголовок статьи
- `category` (string, обязательно) - Категория: 'architecture', 'interior', 'country', 'landscape', 'technology'
- `author_id` (integer, обязательно) - ID автора из таблицы architects
- `publication_date` (date) - Дата публикации
- `short_description` (text) - Краткое описание
- `main_image` (file) - Главное изображение статьи
- `content_blocks` (JSON string) - Массив блоков контента
- `content_image_0`, `content_image_1`, ... - Файлы изображений для блоков

**Пример content_blocks:**
```json
[
  {"type": "text", "content": "Текст статьи", "order": 0},
  {"type": "image", "caption": "Подпись к изображению", "order": 1}
]
```

**Ответ:**
```json
{
  "success": true,
  "article": {
    "id": 123,
    "title": "Заголовок статьи",
    "slug": "zagolovok-stati",
    "category": "architecture",
    "main_image_url": "https://...",
    "publication_date": "2024-01-15"
  },
  "urls": {
    "view": "/article.html?id=123",
    "admin": "/admin"
  },
  "uploaded_files": {
    "main_image": "https://...",
    "content_images": ["https://..."]
  }
}
```

### GET /api/articles
Получение списка статей для страницы articles.html

**Ответ:**
```json
{
  "success": true,
  "articles": [
    {
      "id": 1,
      "title": "Заголовок",
      "category": "architecture",
      "category_name": "Архитектура",
      "short_description": "Описание",
      "main_image_url": "https://...",
      "main_author": "Иван Иванов",
      "formatted_date": "15 января 2024"
    }
  ]
}
```

### GET /api/articles/:id
Получение конкретной статьи для страницы article.html

**Ответ:**
```json
{
  "success": true,
  "article": {
    "id": 1,
    "title": "Заголовок",
    "category": "architecture",
    "category_name": "Архитектура",
    "main_author": "Иван Иванов",
    "author_bio": "Биография автора",
    "formatted_date": "15 января 2024"
  },
  "content_blocks": [
    {
      "id": 1,
      "block_type": "text",
      "content": "Текст статьи",
      "sort_order": 0
    },
    {
      "id": 2,
      "block_type": "image",
      "image_url": "https://...",
      "caption": "Подпись",
      "sort_order": 1
    }
  ]
}
```

### GET /api/authors
Получение списка авторов для выпадающего списка

**Ответ:**
```json
{
  "success": true,
  "authors": [
    {
      "id": 1,
      "full_name": "Иванов Иван Иванович",
      "position": "Главный архитектор"
    }
  ]
}
```

## Структура базы данных

### Обновления таблицы `articles`:
```sql
-- Новые столбцы
category VARCHAR(100) NOT NULL DEFAULT 'general'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- Переименование
excerpt -> short_description
```

### Обновления таблицы `content_blocks`:
```sql
-- Обновленный тип
block_type ENUM('text','quote','list','subtitle','image')

-- Новые столбцы
image_url TEXT
caption VARCHAR(500)
```

## Структура файлов на Яндекс Диске

```
Architecture&design/
└── articles/
    └── article_{id}_{slug}/
        ├── main/           # Главное изображение
        │   └── {timestamp}_{filename}.jpg
        └── content/        # Изображения блоков контента
            ├── {timestamp}_{filename1}.jpg
            └── {timestamp}_{filename2}.jpg
```

## Использование админ панели

1. **Откройте админ панель:** `http://localhost:3001/admin`
2. **Нажмите "Добавить статью"**
3. **Заполните обязательные поля:**
   - Заголовок статьи
   - Категория (выбор из списка)
   - Автор (выбор из базы данных)
4. **Добавьте главное изображение** (необязательно)
5. **Создайте блоки контента:**
   - Нажмите "+ Текст" для текстового блока
   - Нажмите "+ Изображение" для блока с изображением
   - Перетаскивайте блоки для изменения порядка
6. **Сохраните статью**

## Алгоритм создания статьи

1. **Валидация данных** - проверка обязательных полей и форматов
2. **Создание slug** - транслитерация заголовка в URL-friendly формат
3. **Создание записи в БД** - сохранение основных данных статьи
4. **Связывание с автором** - запись в article_architects
5. **Создание папок на Яндекс Диске** - структура для изображений
6. **Загрузка главного изображения** - если выбрано
7. **Обработка блоков контента** - сохранение текста и загрузка изображений
8. **Получение прямых ссылок** - для отображения изображений
9. **Сохранение в таблицу images** - для учета всех изображений

## Обработка ошибок

Система включает полную обработку ошибок:
- ✅ Валидация входящих данных
- ✅ Проверка размера и типа файлов
- ✅ Откат транзакций при ошибках
- ✅ Логирование операций
- ✅ Пользовательские уведомления

## Безопасность

- ✅ Проверка типов файлов (только изображения)
- ✅ Ограничение размера файлов (10MB)
- ✅ Валидация обязательных полей
- ✅ Экранирование SQL запросов
- ✅ Использование подготовленных запросов

## Отладка

### Логи сервера
Сервер выводит подробные логи всех операций:
```
Начало создания статьи: Заголовок статьи
Статья создана с ID: 123
Создание папки: Architecture&design/articles/article_123_zagolovok-stati
Загрузка файла: Architecture&design/articles/article_123_zagolovok-stati/main/1640995200000_image.jpg
Обработано 2 блоков контента
```

### Проверка API
```bash
# Проверка списка авторов
curl http://localhost:3001/api/authors

# Проверка списка статей
curl http://localhost:3001/api/articles

# Проверка конкретной статьи
curl http://localhost:3001/api/articles/1
```

## Расширение системы

Система легко расширяется для добавления:
- ✅ Новых типов блоков контента
- ✅ Дополнительных полей статей
- ✅ Системы тегов
- ✅ Комментариев
- ✅ Системы оценок

Для добавления нового типа блока:
1. Обновите ENUM в `content_blocks.block_type`
2. Добавьте обработку в `articles.js`
3. Создайте шаблон в `admin.html`
4. Добавьте рендеринг в `article.html`

## Интеграция с фронтендом

### Страница articles.html
Используйте API `/api/articles` для получения списка:
```javascript
fetch('/api/articles')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      renderArticlesList(data.articles);
    }
  });
```

### Страница article.html
Используйте API `/api/articles/{id}` для получения статьи:
```javascript
fetch(`/api/articles/${articleId}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      renderArticle(data.article, data.content_blocks);
    }
  });
``` 