const mysql = require('mysql2/promise');
const dbConfig = require('../../db_config');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        const [cases] = await connection.execute(`
            SELECT entity_id, url, alt_text, title, sort_order
            FROM images 
            WHERE entity_type = 'case' 
            ORDER BY sort_order
        `);

        await connection.end();

        res.status(200).json({
            success: true,
            cases: cases
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed' 
        });
    }
}

module.exports = handler; 