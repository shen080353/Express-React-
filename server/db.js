const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));
db.exec(`
    CREATE TABLE IF NOT EXISTS accounts(
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT '收银员',
        phone TEXT NOT NULL DEFAULT '',
        createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        emoji TEXT NOT NULL DEFAULT '🍎',
        price REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL DEFAULT '个',
        stock INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders(
        id TEXT PRIMARY KEY,
        customer TEXT NOT NULL DEFAULT '顾客',
        items TEXT NOT NULL DEFAULT '',
        total REAL NOT NULL DEFAULT 0,
        time TEXT NOT NULL
    );
`);
function seed() {
    const accountCount = db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n;
    if (accountCount === 0) {
        db.prepare('INSERT INTO accounts (id, username, name, role, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
            .run('admin', 'admin', '系统管理员', '管理员', '', new Date().toLocaleString('zh-CN'));
    }
    const productCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
    if (productCount === 0) {
        const insert = db.prepare('INSERT INTO products (id, name, emoji, price, unit, stock) VALUES (?, ?, ?, ?, ?, ?)');
        const defaults = [
            { id: 'p1', name: '苹果', emoji: '🍎', price: 5.5, unit: '斤', stock: 100 },
            { id: 'p2', name: '牛奶', emoji: '🥛', price: 12, unit: '盒', stock: 50 },
            { id: 'p3', name: '面包', emoji: '🍞', price: 8, unit: '袋', stock: 30 },
            { id: 'p4', name: '鸡蛋', emoji: '🥚', price: 6.5, unit: '斤', stock: 80 },
            { id: 'p5', name: '香蕉', emoji: '🍌', price: 4, unit: '斤', stock: 60 },
            { id: 'p6', name: '大米', emoji: '🍚', price: 45, unit: '袋', stock: 20 },
            { id: 'p7', name: '可乐', emoji: '🥤', price: 3, unit: '瓶', stock: 200 },
            { id: 'p8', name: '洗衣液', emoji: '🧴', price: 29.9, unit: '瓶', stock: 15 },
        ];
        for (const p of defaults) {
            insert.run(p.id, p.name, p.emoji, p.price, p.unit, p.stock);
        }
    }
}
seed();

module.exports = db;
