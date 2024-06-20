const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();

app.use(bodyParser.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "cash_transaction"
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// API endpoint to collect cash from couriers
app.post('/collect_cash', (req, res) => {
  const { courier_id, amount } = req.body;

  console.log('Received request body:', req.body);

  if (!courier_id || !amount) {
    return res.status(400).json({ status: 'error', message: 'Missing courier_id or amount' });
  }

  const query = 'INSERT INTO transactions (courier_id, amount) VALUES (?, ?)';
  db.query(query, [courier_id, amount], (err, result) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.status(201).json({ status: 'success', message: 'Transaction recorded successfully' });
  });
});



// API endpoint to process transaction using 3rd party API
app.post('/process_transaction', (req, res) => {
    const transactionData = req.body;
  
    axios.post('http://localhost:8080/v1/wallet/transaction', transactionData)
      .then(response => {
        res.json(response.data);
      })
      .catch(error => {
        if (error.response) {
          res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
          res.status(500).json({ status: 'error', message: 'No response from server' });
        } else {
          res.status(500).json({ status: 'error', message: error.message });
        }
      });
  });


// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
