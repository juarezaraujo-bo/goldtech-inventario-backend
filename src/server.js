require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./models/db');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Initialize Database
initDb();

// Routes Placeholder
app.get('/', (req, res) => {
    res.json({ message: 'Goldtech Inventory API is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const clientRoutes = require('./routes/client');
const reportRoutes = require('./routes/report');
const monitoringRoutes = require('./routes/monitoring');
const userRoutes = require('./routes/users');
const agentRoutes = require('./routes/agent');

const authController = require('./controllers/authController');

app.use('/api/auth', authRoutes);
app.post('/api/login', authController.login);
app.use('/api/equipments', equipmentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/users', userRoutes);
app.use('/api/agent', agentRoutes);

// 404 JSON Handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});


app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
