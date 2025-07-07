const mysql = require('mysql2/promise');
const dbConfig = require('./db_config');

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// Проверка соединения при запуске
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Соединение с базой данных успешно установлено');
        connection.release();
        return true;
    } catch (error) {
        console.error('Ошибка подключения к базе данных:', error.message);
        return false;
    }
}

// Выполнение запроса с параметрами
async function query(sql, params = []) {
    try {
        const [results] = await pool.execute(sql, params);
        return results;
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error.message);
        console.error('SQL:', sql);
        console.error('Параметры:', params);
        throw error;
    }
}

// Получение одной записи (или null, если запись не найдена)
async function getOne(sql, params = []) {
    const results = await query(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Вставка записи и получение ID
async function insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');
    
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    
    try {
        const result = await query(sql, values);
        return result.insertId;
    } catch (error) {
        console.error(`Ошибка вставки в таблицу ${table}:`, error.message);
        throw error;
    }
}

// Обновление записи
async function update(table, data, whereClause, whereParams = []) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map(key => `${key} = ?`).join(',');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    try {
        const result = await query(sql, [...values, ...whereParams]);
        return result.affectedRows;
    } catch (error) {
        console.error(`Ошибка обновления в таблице ${table}:`, error.message);
        throw error;
    }
}

// Удаление записи
async function remove(table, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    try {
        const result = await query(sql, whereParams);
        return result.affectedRows;
    } catch (error) {
        console.error(`Ошибка удаления из таблицы ${table}:`, error.message);
        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    query,
    getOne,
    insert,
    update,
    remove
}; 