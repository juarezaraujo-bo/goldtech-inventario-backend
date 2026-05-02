const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database/inventory.sqlite');
const db = new sqlite3.Database(dbPath);

const ADMIN_EMAIL = 'juarez@goldtechnologia.com.br';
const ADMIN_PASS = 'Goldtech@123';
const ADMIN_NAME = 'Juarez Diniz';

console.log('--- RESET ADMIN SCRIPT ---');

db.serialize(() => {
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);

  // 1. Remover o admin antigo se existir
  db.run(`DELETE FROM users WHERE email = 'admin@goldtech.com'`);

  // 2. Criar ou Atualizar o novo admin (Juarez)
  db.get(`SELECT id FROM users WHERE email = ?`, [ADMIN_EMAIL], (err, row) => {
    if (row) {
      db.run(`UPDATE users SET name = ?, username = ?, password = ?, role = 'admin' WHERE email = ?`, 
        [ADMIN_NAME, ADMIN_EMAIL, hash, ADMIN_EMAIL], (err) => {
          if (err) console.error('Erro ao atualizar admin:', err.message);
          else console.log(`Usuário ${ADMIN_EMAIL} atualizado.`);
        });
    } else {
      db.run(`INSERT INTO users (name, username, email, password, role) VALUES (?, ?, ?, ?, ?)`,
        [ADMIN_NAME, ADMIN_EMAIL, ADMIN_EMAIL, hash, 'admin'], (err) => {
          if (err) console.error('Erro ao criar admin:', err.message);
          else console.log(`Novo usuário ${ADMIN_EMAIL} criado.`);
        });
    }
  });
});

setTimeout(() => {
  db.close();
  console.log('Script finalizado.');
}, 2000);
