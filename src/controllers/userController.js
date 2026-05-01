const bcrypt = require('bcryptjs');
const { db } = require('../models/db');

// GET /api/users — lista todos os usuários (sem senha)
exports.getAll = (req, res) => {
  db.all("SELECT id, name, email, role FROM users ORDER BY id ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
};

// POST /api/users — cria novo usuário (apenas admin)
exports.create = (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const userRole = role === 'admin' ? 'admin' : 'user';

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, hashedPassword, userRole],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        return res.status(500).json({ message: err.message });
      }
      res.status(201).json({ success: true, id: this.lastID, name, email, role: userRole });
    }
  );
};

// PUT /api/users/:id — edita nome/email/role (apenas admin)
exports.update = (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Nome e e-mail são obrigatórios.' });
  }

  const userRole = role === 'admin' ? 'admin' : 'user';

  db.run(
    "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
    [name, email, userRole, id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }
        return res.status(500).json({ message: err.message });
      }
      if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
      res.json({ success: true, message: 'Usuário atualizado.' });
    }
  );
};

// PUT /api/users/change-password — altera senha (usuário autenticado altera a própria)
exports.changePassword = (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.userId; // vem do authMiddleware

  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });
  }

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const valid = bcrypt.compareSync(current_password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Senha atual incorreta.' });
    }

    const hashedNew = bcrypt.hashSync(new_password, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedNew, userId], function (err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, message: 'Senha alterada com sucesso.' });
    });
  });
};

// DELETE /api/users/:id — remove usuário (apenas admin, não pode se auto-deletar)
exports.remove = (req, res) => {
  const { id } = req.params;

  if (Number(id) === req.userId) {
    return res.status(400).json({ message: 'Você não pode excluir seu próprio usuário.' });
  }

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ success: true, message: 'Usuário excluído.' });
  });
};
