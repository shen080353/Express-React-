import { useState, useEffect } from 'react';

// 购物：商品列表 + 购物车（商品来自后端，结算保存订单并扣减库存）
function Shop({ currentUser }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [notice, setNotice] = useState(null); // { type: 'success'|'error', text }

  // 挂载时从后端拉取商品列表
  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('获取商品失败', err));
  }, []);

  // 加入购物车：已有则数量 +1，没有则新增
  function addToCart(product) {
    setCart((prev) => {
      const found = prev.find((item) => item.id === product.id);
      if (found) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  // 改数量：delta 为 1 加一，-1 减一；减到 0 自动移除
  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  async function checkout() {
    if (cart.length === 0) return;

    // 库存不足则直接拦截
    const insufficient = cart.find((item) => {
      const product = products.find((p) => p.id === item.id);
      return product && item.qty > product.stock;
    });
    if (insufficient) {
      setNotice({ type: 'error', text: `「${insufficient.name}」库存不足，无法结算` });
      return;
    }

    // 订单明细：把购物车转成 JSON 存进 items
    const items = cart.map((item) => ({
      id: item.id,
      name: item.name,
      emoji: item.emoji,
      price: item.price,
      unit: item.unit,
      qty: item.qty,
    }));
    const order = {
      customer: currentUser ? currentUser.name : '顾客',
      items: JSON.stringify(items),
      total: totalPrice,
    };

    try {
      // 1) 保存订单
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) {
        const errData = await res.json();
        setNotice({ type: 'error', text: errData.message || '结算失败' });
        return;
      }

      // 2) 扣减库存：每个商品 PUT 一次（stock = 当前库存 - 购买数量）
      for (const item of cart) {
        const product = products.find((p) => p.id === item.id);
        if (!product) continue;
        const newStock = Math.max(0, product.stock - item.qty);
        await fetch(`/api/products/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: newStock }),
        });
      }

      // 3) 同步本地库存、清空购物车、提示成功
      setProducts((prev) =>
        prev.map((p) => {
          const item = cart.find((c) => c.id === p.id);
          return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p;
        })
      );
      setCart([]);
      setNotice({ type: 'success', text: `结算成功！共 ${totalCount} 件商品，合计 ¥${totalPrice.toFixed(2)}` });
    } catch (err) {
      setNotice({ type: 'error', text: '结算失败：' + err.message });
    }
  }

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      {notice && (
        <div className={notice.type === 'success' ? 'success' : 'error'}>
          {notice.type === 'success' ? '✅ ' : '⚠️ '}{notice.text}
        </div>
      )}

      {/* 商品列表 */}
      <section className="card">
        <h2 className="card-title">🛍️ 商品列表</h2>
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-emoji">{p.emoji}</div>
              <div className="product-name">{p.name}</div>
              <div className="product-price">¥{p.price.toFixed(2)} / {p.unit}</div>
              <button className="btn btn-primary btn-add" onClick={() => addToCart(p)}>
                加入购物车
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 购物车 */}
      <section className="card">
        <div className="list-header">
          <h2 className="card-title">🧺 购物车</h2>
          {cart.length > 0 && (
            <button className="btn btn-ghost" onClick={clearCart}>清空</button>
          )}
        </div>

        {cart.length === 0 ? (
          <div className="empty">购物车还是空的，去挑点东西吧～</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th>单价</th>
                  <th>数量</th>
                  <th>小计</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.id}>
                    <td>{item.emoji} {item.name}</td>
                    <td>¥{item.price.toFixed(2)}</td>
                    <td>
                      <div className="qty">
                        <button onClick={() => changeQty(item.id, -1)}>−</button>
                        <span>{item.qty}</span>
                        <button onClick={() => changeQty(item.id, 1)}>＋</button>
                      </div>
                    </td>
                    <td>¥{(item.price * item.qty).toFixed(2)}</td>
                    <td>
                      <button className="btn btn-danger" onClick={() => removeItem(item.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-footer">
              <div className="cart-total">
                共 <span className="total-count">{totalCount}</span> 件，合计
                <span className="total-price">¥{totalPrice.toFixed(2)}</span>
              </div>
              <button className="btn btn-primary" onClick={checkout}>结算</button>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export default Shop;
