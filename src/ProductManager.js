import { useState, useEffect } from 'react';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', emoji: '🍎', price: '', unit: '个', stock: '' });
  const [editingId, setEditingId] = useState(null); // null = 新增，有值 = 编辑
  const [error, setError] = useState('');

  // 挂载时从后端拉取商品列表
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => setError('获取商品失败：' + err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!name) {
      setError('商品名不能为空');
      return;
    }
    if (form.price === '' || form.stock === '') {
      setError('单价和库存不能为空');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('价格必须是大于等于 0 的数字');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError('库存必须是非负整数');
      return;
    }

    const data = { name, emoji: form.emoji, price, unit: form.unit, stock };

    try {
      if (editingId) {
        // 更新商品
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const updated = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
      } else {
        // 新增商品
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.message || '创建失败');
          return;
        }
        const created = await res.json();
        setProducts((prev) => [created, ...prev]);
      }

      setForm({ name: '', emoji: '🍎', price: '', unit: '个', stock: '' });
      setEditingId(null);
      setError('');
    } catch (err) {
      setError('请求失败：' + err.message);
    }
  }

  function handleEdit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, emoji: p.emoji, price: String(p.price), unit: p.unit, stock: String(p.stock) });
    setError('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ name: '', emoji: '🍎', price: '', unit: '个', stock: '' });
    setError('');
  }

  async function handleDelete(id) {
    if (window.confirm('确定删除这个商品吗?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) handleCancelEdit();
    }
  }

  // 入库 / 出库：后端没有单独的库存接口，用 PUT 直接改 stock
  async function adjustStock(id, delta) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + delta);
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock: newStock }),
    });
    const updated = await res.json();
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">{editingId ? '✏️ 编辑商品' : '➕ 新增商品'}</h2>
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              <span>商品名 *</span>
              <input name="name" value={form.name} onChange={handleChange} placeholder="如 苹果" />
            </label>
            <label>
              <span>图标（emoji）</span>
              <input name="emoji" value={form.emoji} onChange={handleChange} />
            </label>
            <label>
              <span>单价（元）*</span>
              <input name="price" value={form.price} onChange={handleChange} placeholder="如 5.5" />
            </label>
            <label>
              <span>单位</span>
              <input name="unit" value={form.unit} onChange={handleChange} placeholder="如 斤 / 盒" />
            </label>
            <label>
              <span>库存 *</span>
              <input name="stock" value={form.stock} onChange={handleChange} placeholder="如 100" />
            </label>
          </div>
          {error && <div className="error">⚠️ {error}</div>}
          <button type="submit" className="btn btn-primary">
            {editingId ? '保存修改' : '新增商品'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
              取消
            </button>
          )}
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">📦 商品库存（共 {products.length} 种）</h2>
        {loading ? (
          <div className="empty">⏳ 加载中...</div>
        ) : products.length === 0 ? (
          <div className="empty">暂无商品，先在上方新增一个吧～</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>商品</th>
                <th>单价</th>
                <th>库存</th>
                <th>入库 / 出库</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.emoji} {p.name}</td>
                  <td>¥{p.price.toFixed(2)} / {p.unit}</td>
                  <td>
                    <span className={p.stock === 0 ? 'stock-out' : ''}>{p.stock}</span>
                  </td>
                  <td>
                    <div className="qty">
                      <button onClick={() => adjustStock(p.id, -1)}>−</button>
                      <button onClick={() => adjustStock(p.id, 1)}>＋</button>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-edit" onClick={() => handleEdit(p)}>编辑</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default ProductManager;
