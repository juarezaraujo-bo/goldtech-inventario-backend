const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database/inventory.sqlite');
const db = new sqlite3.Database(dbPath);

const ADMIN_EMAIL = 'juarez@goldtechnologia.com.br';
const ADMIN_PASS = 'Goldtech@123';
const ADMIN_NAME = 'Juarez (Admin)';

console.log('--- RESET ADMIN SCRIPT ---');

db.serialize(() => {
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);

  // 1. Remover o admin antigo se existir
  db.run(`DELETE FROM users WHERE email = 'admin@goldtech.com'`, (err) => {
    if (err) console.error('Erro ao remover admin antigo:', err.message);
    else console.log('Admin antigo (admin@goldtech.com) removido ou inexistente.');
  });

  // 2. Criar ou Atualizar o novo admin
  db.get(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL], (err, row) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return;
    }

    if (row) {
      // Atualizar
      db.run(`UPDATE users SET password = ?, role = 'admin', name = ? WHERE email = ?`, 
        [hash, ADMIN_NAME, ADMIN_EMAIL], (err) => {
          if (err) console.error('Erro ao atualizar admin:', err.message);
          else console.log(`Usuário ${ADMIN_EMAIL} atualizado com nova senha e perfil admin.`);
        });
    } else {
      // Inserir
      db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
        [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin'], (err) => {
          if (err) console.error('Erro ao criar admin:', err.message);
          else console.log(`Novo usuário ${ADMIN_EMAIL} criado com sucesso.`);
        });
    }
  });
});

setTimeout(() => {
  db.close();
  console.log('Script finalizado.');
}, 2000);
