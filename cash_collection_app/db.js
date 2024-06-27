const config = require('./config');
const mysql = require('mysql2/promise');

const shardPools = config.shards.map(shardConfig => mysql.createPool(shardConfig));

const getShard = (courier_id) => {
    const shardIndex = courier_id % config.shardCount;
    return shardPools[shardIndex];
};

shardPools.forEach((pool, index) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(`Database connection to shard ${index} failed: ${err.stack}`);
            return;
        }
        console.log(`Connected to shard ${index}.`);
        connection.release();
    });
});

module.exports = {
    getShard
};
