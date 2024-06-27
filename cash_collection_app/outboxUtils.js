// outboxUtil.js
const mysql = require('mysql2/promise');
const config = require('./config');

const insertIntoOutbox = async (payload) => {
    const connection = await mysql.createConnection(config.shards[0]); // Use appropriate shard
    try {
        await connection.query('INSERT INTO outbox (event_type, payload, processed, created_at) VALUES (?, ?, ?, ?)', ['transaction', JSON.stringify(payload), false, new Date()]);
    } catch (error) {
        console.error('Error inserting into outbox:', error);
    } finally {
        connection.end();
    }
};

module.exports = {
    insertIntoOutbox
};
