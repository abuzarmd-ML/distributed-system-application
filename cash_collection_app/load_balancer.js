const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 4000; // Port for the load balancer

// List of application instances
const instances = [
    { url: 'http://localhost:3001', healthy: false },
    { url: 'http://localhost:3002', healthy: false }
];

let currentIndex = 0;

const healthCheckInterval = 5000; // 5 seconds
const healthCheck = async () => {
    for (let instance of instances) {
        try {
            const response = await axios.get(`${instance.url}/health`);
            console.log(`${instance.url} is healthy: ${response.status === 200}`);
            instance.healthy = response.status === 200;
        } catch (error) {
            console.log(`${instance.url} is not healthy`);
            instance.healthy = false;
        }
    }
};

healthCheck();
setInterval(healthCheck, healthCheckInterval);

const getNextInstance = () => {
    const availableInstances = instances.filter(instance => instance.healthy);
    if (availableInstances.length === 0) {
        return null;
    }
    const instance = availableInstances[currentIndex];
    currentIndex = (currentIndex + 1) % availableInstances.length;
    return instance;
};

app.all('*', (req, res) => {
    const instance = getNextInstance();
    if (!instance) {
        return res.status(503).send('Service Unavailable');
    }
    const redirectUrl = `${instance.url}${req.originalUrl}`;
    console.log(`Redirecting to ${redirectUrl}`);
    res.redirect(302, redirectUrl);
});

app.listen(PORT, () => {
    console.log(`Load balancer running on port ${PORT}`);
});
