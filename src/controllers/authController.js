const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../models/db');

exports.login = (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const loginIdentifier = username || email;

    if (!loginIdentifier || !password) {
      return res.status(400).json({ message: 'Login e senha obrigatórios' });
    }

    db.get(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [loginIdentifier, loginIdentifier],
      (err, user) => {
        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json({ message: 'Erro no banco' });
        }

        if (!user) {
          return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        // Fallback texto puro
        if (!user.password.startsWith('$2') && user.password.length < 30) {
            if (password === user.password) {
                const token = jwt.sign(
                    { id: user.id, role: user.role },
                    process.env.JWT_SECRET || 'goldtech_secret_key',
                    { expiresIn: '1d' }
                );
                return res.json({
                    token,
                    user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role }
                });
            } else {
                return res.status(401).json({ message: 'Senha inválida' });
            }
        }

        // Comparação com bcrypt (versão callback para não travar a thread)
        bcrypt.compare(password, user.password, (err, valid) => {
          if (err) {
            console.error("BCRYPT ERROR:", err);
            return res.status(500).json({ message: 'Erro na senha' });
          }

          if (!valid) {
            return res.status(401).json({ message: 'Senha inválida' });
          }

          const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'goldtech_secret_key',
            { expiresIn: '1d' }
          );

          return res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              name: user.name,
              role: user.role
            }
          });
        });
      }
    );

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

exports.me = (req, res) => {
    db.get("SELECT id, name, email, role FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error on the server' });
        }
        res.status(200).json(user);
    });
};
