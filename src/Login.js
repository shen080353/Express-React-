import { ROLE_CLASS } from './constants';

// 登录页：从已有账号里选一个登录
function Login({ accounts, onLogin }) {
  return (
    <div className="login">
      <header className="banner">
        <div className="banner-title">
          <span className="cart">🛒</span>
          <h1>超市购物管理系统</h1>
          <p>请选择一个账号登录</p>
        </div>
      </header>

      <main className="login-body">
        <h2 className="login-heading">选择登录账号</h2>

        {accounts.length === 0 ? (
          <div className="empty">暂无账号</div>
        ) : (
          <div className="account-list">
            {accounts.map((a) => (
              <button
                key={a.id}
                className="account-item"
                onClick={() => onLogin(a)}
              >
                <span className="account-avatar">👤</span>
                <div className="account-info">
                  <div className="account-name">{a.name}</div>
                  <div className="account-username">@{a.username}</div>
                </div>
                <span className={`role role-${ROLE_CLASS[a.role] || ''}`}>
                  {a.role}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">🛒 超市购物管理系统 · 前端演示</footer>
    </div>
  );
}

export default Login;
