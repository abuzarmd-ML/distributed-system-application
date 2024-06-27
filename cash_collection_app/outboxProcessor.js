// outboxProcessor.js
const mysql = require('mysql2/promise');
const axios = require('axios');
const config = require('./config');
const { insertIntoOutbox } = require('./outboxUtils');

const processOutbox = async () => {
    const db = mysql.createPool(config.shards[0]); // Using the first shard for the outbox table
    while (true) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [rows] = await connection.query('SELECT * FROM outbox WHERE processed = FALSE LIMIT 10');

            for (const row of rows) {
                const message = JSON.parse(row.payload);

                try {
                    const response = await axios.post('http://localhost:8181/v1/wallet/transaction', message);

                    console.log(`Request sent to 3rd party system: ${JSON.stringify(message)}`);
                    console.log(`Response from 3rd party system: ${JSON.stringify(response.data)}`);

                    if (response.status === 200) {
                        await connection.query('UPDATE outbox SET processed = TRUE WHERE id = ?', [row.id]);
                        console.log(`Processed outbox message ${row.id}`);
                    } else {
                        console.error(`Failed to process outbox message ${row.id}: ${response.statusText}`);
                    }
                } catch (error) {
                    console.error(`Failed to process outbox message ${row.id}`, error.message);
                }
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            console.error('Error processing outbox:', error);
        } finally {
            connection.release();
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
    }
};

processOutbox().catch(error => {
    console.error('Failed to process outbox', error);
    process.exit(1);
});
