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

// INICIALIZAÇÃO COMPLETA: Cria tabelas e dados de teste
db.serialize(() => {
    // 1. Tabela de Usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    // 2. Tabela de Clientes
    db.run(`CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE,
        email TEXT
    )`);

    // 3. Tabela de Equipamentos (Inventário)
    db.run(`CREATE TABLE IF NOT EXISTS equipamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_nome TEXT,
        hostname TEXT,
        cpu TEXT,
        ram TEXT,
        disco TEXT,
        status TEXT,
        ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Criar Usuário Admin padrão
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, ['admin', hash, 'admin']);

    // Criar Dados de Teste (para o sistema não iniciar vazio no Render)
    db.get("SELECT COUNT(*) as count FROM equipamentos", (err, row) => {
        if (row && row.count === 0) {
            db.run(`INSERT OR IGNORE INTO clientes (nome, email) VALUES ('Cliente Teste Goldtech', 'contato@goldtech.com.br')`);

            const stmt = db.prepare(`INSERT INTO equipamentos (cliente_nome, hostname, cpu, ram, disco, status) VALUES (?, ?, ?, ?, ?, ?)`);
            stmt.run('Cliente Teste Goldtech', 'DESKTOP-PORTARIA', 'Core i3', '8GB', '240GB SSD', 'Online');
            stmt.run('Cliente Teste Goldtech', 'SERV-BACKUP', 'Xeon E5', '32GB', '4TB HDD', 'Offline');
            stmt.finalize();
            console.log("✅ Tabelas e dados de teste criados com sucesso.");
        }
    });
});

// ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "Erro no banco de dados" });
        if (!user) return res.status(401).json({ error: "Usuário não encontrado" });

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) return res.status(401).json({ error: "Senha inválida" });

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            return res.json({
                token,
                user: { id: user.id, username: user.username, role: user.role }
            });
        } catch (error) {
            return res.status(500).json({ error: "Erro ao processar login" });
        }
    });
});

// ROTA DE RESET ADMIN (Segura)
app.post('/api/admin/reset-login', (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);

    db.run(`UPDATE users SET password = ? WHERE username = 'admin'`, [hash], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao resetar admin" });
        return res.json({ message: "Senha do admin resetada para 'admin'" });
    });
});

// ROTA PARA O FRONTEND BUSCAR EQUIPAMENTOS (Exemplo para popular sua tela)
app.get('/api/equipamentos', (req, res) => {
    db.all("SELECT * FROM equipamentos", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/', (req, res) => res.json({ message: "Goldtech Inventory API is running" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));