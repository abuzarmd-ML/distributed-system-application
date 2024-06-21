const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const axios = require('axios');

const app = express();
const PORT = process.argv[2] || 3000;

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cash_transaction'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database.');
});

// Endpoint to collect cash
app.post('/collect_cash', (req, res) => {
    const { courier_id, amount } = req.body;
    if (!courier_id || !amount) {
        return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }

    const query = 'INSERT INTO transactions (courier_id, amount) VALUES (?, ?)';
    db.query(query, [courier_id, amount], (error, results) => {
        if (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
        
        axios.post('http://localhost:8181/v1/wallet/transaction', {
            amount: amount,
            currency: 'USD',
            description: `Transaction for courier ${courier_id}`,
            userId: courier_id.toString()
        })
        .then(response => {
            res.json({
                status: 'success',
                data: {
                    transactionId: response.data.data.transactionId,
                    status: response.data.data.status
                }
            });
        })
        .catch(error => {
            res.status(500).json({ status: 'error', message: error.message });
        });
    });
});

app.get('/health', (req, res) => {
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
