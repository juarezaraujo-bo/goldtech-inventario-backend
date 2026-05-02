const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'goldtech_secret_key';
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

// Conexão com SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Erro ao abrir banco:", err.message);
    else console.log("Conectado ao SQLite em:", DB_PATH);
});

// INICIALIZAÇÃO: Cria tabelas e dados de teste para o sistema não iniciar vazio
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS clientes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT UNIQUE, email TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS equipamentos (id INTEGER PRIMARY KEY AUTOINCREMENT, cliente_nome TEXT, hostname TEXT, cpu TEXT, ram TEXT, disco TEXT, status TEXT, ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP)`);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hash, 'admin']);

    db.get("SELECT COUNT(*) as count FROM equipamentos", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT OR IGNORE INTO clientes (nome, email) VALUES ('Cliente Exemplo Goldtech', 'contato@goldtech.com.br')`);
            const stmt = db.prepare(`INSERT INTO equipamentos (cliente_nome, hostname, cpu, ram, disco, status) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run('Cliente Exemplo Goldtech', 'SRV-PRODUCAO', 'Intel Xeon', '32GB', '1TB SSD', 'Online');
            stmt.run('Cliente Exemplo Goldtech', 'NOTE-JUAREZ', 'Core i7', '16GB', '512GB SSD', 'Online');
            stmt.finalize();
        }
    });
});

// --- ROTA DE LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Usuário não encontrado" });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Senha inválida" });
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// --- ROTAS QUE O SEU CONSOLE PEDIU (404 FIX) ---

app.get('/api/clients', (req, res) => {
    db.all("SELECT * FROM clientes", [], (err, rows) => res.json(rows || []));
});

app.get('/api/equipments', (req, res) => {
    db.all("SELECT * FROM equipamentos", [], (err, rows) => res.json(rows || []));
});

app.get('/equipments/stats', (req, res) => {
    db.get("SELECT count(*) as total, sum(case when status = 'Online' then 1 else 0 end) as online FROM equipamentos", [], (err, row) => {
        res.json(row || { total: 0, online: 0 });
    });
});

app.get('/monitoring/summary', (req, res) => {
    db.all("SELECT * FROM equipamentos ORDER BY ultima_atualizacao DESC LIMIT 5", [], (err, rows) => res.json(rows || []));
});

// --- OUTRAS CONFIGURAÇÕES ---
app.post('/api/admin/reset-login', (req, res) => {
    const hash = bcrypt.hashSync('admin', bcrypt.genSaltSync(10));
    db.run(`UPDATE users SET password = ? WHERE username = 'admin'`, [hash], (err) => res.json({ message: "Resetado" }));
});

app.get('/', (req, res) => res.json({ message: "Goldtech Inventory API is running" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));