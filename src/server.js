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

// Conexão Segura com SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("Erro ao abrir banco:", err.message);
    else console.log("Conectado ao SQLite em:", DB_PATH);
});

// INICIALIZAÇÃO: Cria tabela e usuário admin se não existirem
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )`);

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);

    // Tenta inserir o admin, se der erro (já existe), ele ignora silenciosamente
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
        ['admin', hash, 'admin']);
});

// 1. CORREÇÃO DA ROTA DE LOGIN
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Usuário e senha são obrigatórios" });
    }

    const query = `SELECT * FROM users WHERE username = ?`;

    db.get(query, [username], async (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Erro interno no servidor" });
        }

        if (!user) {
            return res.status(401).json({ error: "Usuário não encontrado" });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: "Senha inválida" });
            }

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

// 2. CORREÇÃO DA ROTA DE RESET (Sem derrubar o servidor)
app.post('/api/admin/reset-login', (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin', salt);

    db.run(`UPDATE users SET password = ? WHERE username = 'admin'`, [hash], (err) => {
        if (err) return res.status(500).json({ error: "Erro ao resetar admin" });
        return res.json({ message: "Senha do admin resetada para 'admin' com sucesso" });
    });
});

// Teste de API
app.get('/', (req, res) => res.json({ message: "Goldtech Inventory API is running" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));