const mysql = require('mysql');
const config = require('./config');

const shardConnections = config.shards.map(shardConfig => mysql.createConnection(shardConfig));

const getShard = (courier_id) => {
    const shardIndex = courier_id % config.shardCount;
    return shardConnections[shardIndex];
};

shardConnections.forEach((connection, index) => {
    connection.connect(err => {
        if (err) {
            console.error(`Database connection to shard ${index} failed: ${err.stack}`);
            return;
        }
        console.log(`Connected to shard ${index}.`);
    });
});

module.exports = {
    getShard
};
