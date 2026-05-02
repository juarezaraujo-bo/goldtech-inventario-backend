require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, db } = require('./models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Initialize Database
initDb();

// Import modular routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const clientRoutes = require('./routes/client');
const reportRoutes = require('./routes/report');
const monitoringRoutes = require('./routes/monitoring');
const userRoutes = require('./routes/users');
const agentRoutes = require('./routes/agent');

const authController = require('./controllers/authController');

// Global Routes
app.get('/', (req, res) => {
    res.json({ message: 'Goldtech Inventory API is running' });
});

// Auth Routes
app.use('/api/auth', authRoutes);
app.post('/api/login', authController.login);

// Rota temporária para reset de admin em produção (Segura)
app.post('/api/admin/reset-login', (req, res) => {
    const username = 'admin';
    const email = 'admin@goldtech.local';
    const name = 'Administrador';
    const password = 'admin';
    const role = 'admin';

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ success: false, message: "Erro ao gerar hash" });

        db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
            if (err) return res.status(500).json({ success: false, message: "Erro no banco" });

            if (row) {
                db.run(
                    "UPDATE users SET password = ?, email = ?, name = ?, role = ? WHERE id = ?",
                    [hash, email, name, role, row.id],
                    (err) => {
                        if (err) return res.status(500).json({ success: false, message: "Erro ao atualizar admin" });
                        res.json({ success: true, message: "Admin resetado com sucesso (Update)" });
                    }
                );
            } else {
                db.run(
                    "INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
                    [name, username, email, hash, role],
                    (err) => {
                        if (err) return res.status(500).json({ success: false, message: "Erro ao criar admin" });
                        res.json({ success: true, message: "Admin resetado com sucesso (Insert)" });
                    }
                );
            }
        });
    });
});

// Modular Routes Registration
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
    console.log(`Backend server running on port ${PORT}`);
});