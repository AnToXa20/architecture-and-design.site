// Конфигурация для подключения к базе данных MySQL
const dbConfig = {
    host: 'localhost',      // Хост MySQL сервера
    port: 3306,             // Порт MySQL сервера
    user: 'root',           // Имя пользователя (по умолчанию root для XAMPP)
    password: '',           // Пароль (по умолчанию пустой для XAMPP)
    database: 'architecture_bureau', // Имя базы данных
    waitForConnections: true,
    connectionLimit: 10,    // Максимальное количество соединений в пуле
    queueLimit: 0
};

module.exports = dbConfig; 