// app.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const CircuitBreaker = require('opossum');
const { getShard } = require('./db');
const config = require('./config');

const app = express();
const PORT = process.argv[2] || 3000;

app.use(bodyParser.json());

axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => {
        const delay = Math.pow(2, retryCount) * 100;
        const jitter = Math.random() * 100;
        return delay + jitter;
    },
    retryCondition: (error) => {
        return error.response && error.response.status >= 500;
    }
});

const circuitBreakerOptions = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
};

const circuitBreaker = new CircuitBreaker((data) => {
    return axios.post('http://localhost:8181/v1/wallet/transaction', data);
}, circuitBreakerOptions);

app.post('/collect_cash', async (req, res) => {
    const { courier_id, amount } = req.body;
    if (!courier_id || !amount) {
        return res.status(400).json({ status: 'error', message: 'Invalid input' });
    }

    const connection = getShard(courier_id);
    const query = 'INSERT INTO transactions (courier_id, amount) VALUES (?, ?)';

    connection.query(query, [courier_id, amount], async (error, results) => {
        if (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }

        try {
            const response = await circuitBreaker.fire({
                amount: amount,
                currency: 'USD',
                description: `Transaction for courier ${courier_id}`,
                userId: courier_id.toString()
            });

            res.json({
                status: 'success',
                data: {
                    transactionId: response.data.data.transactionId,
                    status: response.data.data.status
                }
            });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    });
});

app.get('/health', (req, res) => {
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});
