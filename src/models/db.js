const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../../../database/inventory.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to SQLite database.');
});

const initDb = async () => {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )`);

    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cnpj TEXT,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      observations TEXT,
      status TEXT DEFAULT 'Ativo'
    )`);

    // Equipments table (Updated with new fields for automatic collection)
    db.run(`CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      nome TEXT NOT NULL,
      categoria TEXT,
      categoria_manual INTEGER DEFAULT 0,
      tipo TEXT,
      fabricante TEXT,
      modelo TEXT,
      numero_serie TEXT,
      patrimonio TEXT UNIQUE,
      usuario_responsavel TEXT,
      localizacao TEXT,
      setor TEXT,
      status TEXT DEFAULT 'Ativo',
      data_aquisicao TEXT,
      garantia TEXT,
      observacoes TEXT,
      
      -- Technical Fields
      sistema_operacional TEXT,
      processador TEXT,
      memoria_ram TEXT,
      armazenamento TEXT,
      disco_livre_gb TEXT,
      bios_versao TEXT,
      bios_data TEXT,
      placa_mae TEXT,
      data_instalacao_os TEXT,
      ultima_inicializacao TEXT,
      ip TEXT,
      mac TEXT,
      dominio TEXT,
      antivirus TEXT,
      ultima_coleta TEXT,
      origem_cadastro TEXT DEFAULT 'manual',
      
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )`);

    // Performance tracking table
    db.run(`CREATE TABLE IF NOT EXISTS equipment_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      cpu_usage_percent REAL,
      memory_usage_percent REAL,
      disk_free_percent REAL,
      disk_free_gb REAL,
      network_usage TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments (id)
    )`);

    // Ticket tracking table to avoid duplicates
    db.run(`CREATE TABLE IF NOT EXISTS inventory_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      motivo_hash TEXT,
      status TEXT DEFAULT 'aberto',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments (id)
    )`);

    // Performance alert → Helpdesk ticket tracking (evitar duplicatas por performance crítica)
    db.run(`CREATE TABLE IF NOT EXISTS monitoring_helpdesk_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      client_id INTEGER,
      alert_type TEXT NOT NULL,
      helpdesk_ticket_id TEXT,
      status TEXT DEFAULT 'aberto',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments (id)
    )`);


    // Maintenance history
    db.run(`CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER,
      date TEXT,
      type TEXT,
      description TEXT,
      technician TEXT,
      cost REAL,
      FOREIGN KEY (equipment_id) REFERENCES equipments (id)
    )`);


    // Default User (Juarez Admin)
    const adminPassword = bcrypt.hashSync('Goldtech@123', 10);
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
      ['Juarez (Admin)', 'juarez@goldtechnologia.com.br', adminPassword, 'admin']);

    // Remove old default admin if it exists
    db.run(`DELETE FROM users WHERE email = 'admin@goldtech.com'`);

    // Seed Clients
    db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
      if (row.count === 0) {
        const stmt = db.prepare(`INSERT INTO clients (name, cnpj, contact_person, status) VALUES (?, ?, ?, ?)`);
        stmt.run('Goldtech Soluções', '12.345.678/0001-90', 'Carlos Silva', 'Ativo');
        stmt.run('Banco Futuro', '98.765.432/0001-10', 'Ana Oliveira', 'Ativo');
        stmt.run('Indústrias Alpha', '55.444.333/0001-22', 'Marcos Santos', 'Ativo');
        stmt.finalize();
        console.log('Seed clients created.');
      }
    });

    // Seed Equipments
    db.get("SELECT COUNT(*) as count FROM equipments", (err, row) => {
      if (row.count === 0) {
        const stmt = db.prepare(`INSERT INTO equipments (client_id, nome, categoria, tipo, fabricante, modelo, patrimonio, status, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        // Client 1
        stmt.run(1, 'Notebook Direção', 'Notebooks', 'Laptop', 'Dell', 'Latitude 5420', 'GT-001', 'Ativo', '192.168.1.15');
        stmt.run(1, 'Servidor Arquivos', 'Servidores', 'Rack', 'HP', 'ProLiant DL380', 'GT-002', 'Ativo', '192.168.1.100');
        stmt.run(1, 'Switch Core', 'Ativos de Rede', 'Switch', 'Cisco', 'Catalyst 9300', 'GT-003', 'Ativo', '192.168.1.1');
        // Client 2
        stmt.run(2, 'Workstation Dev 1', 'Desktops', 'Workstation', 'HP', 'Z2 G9', 'BF-101', 'Ativo', '10.0.0.50');
        stmt.run(2, 'Roteador Borda', 'Roteadores', 'Router', 'MikroTik', 'CCR2004', 'BF-102', 'Ativo', '10.0.0.1');
        stmt.finalize();
        console.log('Seed equipments created.');
      }
    });
  });
};

// Database initialization handled by server.js

module.exports = { db, initDb };
