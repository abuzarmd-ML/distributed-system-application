module.exports = {
    shards: [
        { host: 'localhost', port: 3306, user: 'root', password: '', database: 'cash_transaction' },
        // { host: 'localhost', port: 3307, user: 'root', password: '', database: 'cash_transaction' }
    ],
    shardCount: 1
};