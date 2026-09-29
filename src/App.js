import { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import AccountManager from './AccountManager';
import Shop from './Shop';
import ProductManager from './ProductManager';


const USER_KEY = 'supermarket-current-user';


// 读取当前登录用户
function loadCurrentUser() {
  const saved = localStorage.getItem(USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function App() {
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(loadCurrentUser);
  const [tab, setTab] = useState('account'); // 'account' 账号管理 | 'shop' 购物

  // 挂载时从后端拉取账号列表
  useEffect(() => {
    fetch('/api/accounts')
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch((err) => console.error('获取账号失败', err));
  }, []);

  // 登录用户变化时保存 / 清除
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [currentUser]);

  // 未登录：显示登录页
  if (!currentUser) {
    return <Login accounts={accounts} onLogin={setCurrentUser} />;
  }

  return (
    <div className="app">
      <header className="banner">
        <div className="banner-icons left">
          <span>🥕</span>
          <span>🍅</span>
          <span>🥦</span>
          <span>🍎</span>
        </div>
        <div className="banner-title">
          <span className="cart">🛒</span>
          <h1>超市购物管理系统</h1>
          <p>账号管理 · 简单高效</p>
        </div>
        <div className="banner-icons right">
          <span>🍇</span>
          <span>🍉</span>
          <span>🥬</span>
          <span>🧺</span>
        </div>
      </header>

      <div className="user-bar">
        <span>
          👤 当前登录：{currentUser.name}（{currentUser.role}）
        </span>
        <button className="btn btn-ghost" onClick={() => setCurrentUser(null)}>
          退出登录
        </button>
      </div>

      <nav className="tabs">
        <button
          className={tab === 'account' ? 'tab active' : 'tab'}
          onClick={() => setTab('account')}
        >
          👥 账号管理
        </button>
        <button
          className={tab === 'shop' ? 'tab active' : 'tab'}
          onClick={() => setTab('shop')}
        >
          🛒 购物
        </button>
        <button
          className={tab === 'stock' ? 'tab active' : 'tab'}
          onClick={() => setTab('stock')}
        >
          📦 库存
        </button>
      </nav>

      <main className="container">
        {tab === 'account' ? (
          <AccountManager
            accounts={accounts}
            setAccounts={setAccounts}
            currentUser={currentUser}
            onLogout={() => setCurrentUser(null)}
          />
        ) : tab==='shop'?(
          <Shop currentUser={currentUser} />
        ):(
          <ProductManager />
        )}
      </main>

      <footer className="footer">🛒 超市购物管理系统 · 前端演示</footer>
    </div>
  );
}

export default App;
