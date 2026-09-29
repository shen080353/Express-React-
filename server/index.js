// ============================================================
// 超市购物管理系统 · 后端 API 服务（Express）
// 运行方式：cd server && npm start    （或 node index.js）
// 默认端口：5000
// ============================================================

const express = require('express');
const cors = require('cors');
const db=require('./db');

const app = express();
const PORT = 5000;

// ===== 中间件 =====
app.use(cors());         // 允许跨域：让 3000 端口的前端能访问 5000 端口的接口
app.use(express.json()); // 自动把请求体里的 JSON 解析成 req.body

// ===== 工具：生成 id =====
function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ============================================================
// 路由（RESTful API）
// 约定：GET 查、POST 增、PUT 改、DELETE 删
// ============================================================

// 健康检查：确认后端能跑
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ---------- 账号 ----------
// 查：获取所有账号
app.get('/api/accounts', (req, res) => {
  const rows=db.prepare('SELECT * FROM accounts ORDER BY rowid DESC').all();
  res.json(rows);
});

// 增：新增账号
app.post('/api/accounts', (req, res) => {
  const { username, name, role, phone } = req.body;

  if (!username || !name) {
    return res.status(400).json({ message: '用户名和姓名不能为空' });
  }
  const exists=db.prepare('SELECT id FROM accounts WHERE username=?').get(username);
  if (exists) {
    return res.status(400).json({ message: '该用户名已存在' });
  }

  const account = {
    id: makeId(),
    username,
    name,
    role: role || '收银员',
    phone: phone || '',
    createdAt: new Date().toLocaleString('zh-CN'),
  };
  db.prepare('INSERT INTO accounts (id, username, name, role, phone, createdAt) VALUES (?, ?, ?, ?, ?, ?)').run(account.id, account.username, account.name, account.role, account.phone, account.createdAt);
  res.status(201).json(account); // 201 = 创建成功
});

// 改：更新账号
app.put('/api/accounts/:id', (req, res) => {
  const current=db.prepare('SELECT * FROM accounts WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({message:'账号不存在'});

  const updated={...current,...req.body};
  try{
    db.prepare('UPDATE accounts SET username=?,name=?,role=?,phone=? WHERE id=?').run(updated.username,updated.name,updated.role,updated.phone,updated.id);
  }catch(err){
    if(err.code==='SQLITE_CONSTRAINT_UNIQUE'){
      return res.status(400).json({message:'用户名已存在'});
    }
    throw err;
  }
  res.json(updated);
});

// 删：删除账号
app.delete('/api/accounts/:id', (req, res) => {
  const info=db.prepare('DELETE FROM accounts WHERE id=?').run(req.params.id);
  if(info.changes===0) return res.status(404).json({message:'账号不存在'});
  res.json({ok:true});
});

// ---------- 商品 ----------
app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products ORDER BY rowid DESC').all());
});

app.post('/api/products', (req, res) => {
  const { name, emoji, price, unit, stock } = req.body;
  if (!name) return res.status(400).json({ message: '商品名不能为空' });

  const product = {
    id: makeId(),
    name,
    emoji: emoji || '🍎',
    price: Number(price) || 0,
    unit: unit || '个',
    stock: Number(stock) || 0,
  };
  db.prepare('INSERT INTO products (id,name,emoji,price,unit,stock) VALUES (?,?,?,?,?,?)').run(product.id,product.name,product.emoji,product.price,product.unit,product.stock);
  res.status(201).json(product);
});

app.put('/api/products/:id', (req, res) => {
  const current=db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if(!current) return res.status(404).json({message:'商品不存在'});

  const updated={...current,...req.body};
  db.prepare('UPDATE products SET name=?,emoji=?,price=?,unit=?,stock=? WHERE id=?').run(updated.name,updated.emoji,updated.price,updated.unit,updated.stock,updated.id);
  res.json(updated);
});

app.delete('/api/products/:id', (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- 订单 ----------
app.get('/api/orders', (req, res) =>{
  res.json(db.prepare('SELECT * FROM orders ORDER BY rowid DESC').all());
});

app.post('/api/orders', (req, res) => {
  const { customer, items, total } = req.body;
  const order = {
    id: makeId(),
    customer: customer || '顾客',
    items: items || '',
    total: Number(total) || 0,
    time: new Date().toLocaleString('zh-CN'),
  };
  db.prepare('INSERT INTO orders (id,customer,items,total,time) VALUES (?,?,?,?,?)').run(order.id,order.customer,order.items,order.total,order.time);
  res.status(201).json(order);
});

// 404 兜底：没匹配到的接口
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在：' + req.method + ' ' + req.path });
});

// ===== 启动 =====
app.listen(PORT, () => {
  console.log('✅ 后端服务已启动：http://localhost:' + PORT);
  console.log('   数据保存在 server/data.db（重启后依然在）');
});