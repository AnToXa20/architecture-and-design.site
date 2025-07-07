const fs = require('fs');
const path = require('path');

// Список страниц для создания
const pages = [
    { file: 'stages.html', title: 'Этапы работы' },
    { file: 'articles.html', title: 'Статьи' },
    { file: 'services.html', title: 'Услуги и цены' },
    { file: 'ai-design.html', title: 'ИИ дизайн' },
    { file: 'about.html', title: 'О нас' },
    { file: 'contacts.html', title: 'Контакты' }
];

// Читаем шаблон
const templatePath = path.join(__dirname, 'template.html');
const template = fs.readFileSync(templatePath, 'utf8');

// Генерируем страницы
pages.forEach(page => {
    const content = template.replace(/\{\{TITLE\}\}/g, page.title);
    const filePath = path.join(__dirname, page.file);
    fs.writeFileSync(filePath, content);
    console.log(`Создана страница: ${page.file}`);
});

console.log('Все страницы успешно созданы!'); 