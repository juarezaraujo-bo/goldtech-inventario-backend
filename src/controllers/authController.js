const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../models/db');

exports.login = (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Login e senha obrigatórios' });
    }

    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, user) => {

        if (err) {
          console.error("DB ERROR:", err);
          return res.status(500).json({ message: 'Erro no banco' });
        }

        if (!user) {
          return res.status(401).json({ message: 'Usuário não encontrado' });
        }

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
              name: user.name,
              username: user.username,
              email: user.email,
              role: user.role
            }
          });
        });
      }
    );

  } catch (err) {
    console.error("LOGIN CRASH:", err);
    return res.status(500).json({ message: 'Erro interno' });
  }
};

exports.me = (req, res) => {
  db.get("SELECT id, name, username, email, role FROM users WHERE id = ?", [req.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor' });
    }
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(200).json(user);
  });
};