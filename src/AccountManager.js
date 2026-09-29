import { useState } from 'react';
import { ROLES, ROLE_CLASS } from './constants';

// 账号管理：查询所有人可用，增删改仅管理员可用
function AccountManager({ accounts, setAccounts, currentUser, onLogout }) {
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ username: '', name: '', role: '收银员', phone: '' });
  const [editingId, setEditingId] = useState(null); // null = 新增，有值 = 编辑该账号
  const [error, setError] = useState('');

  const isAdmin = currentUser.role === '管理员';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // 提交：既处理「新增」也处理「编辑」
  async function handleSubmit(e) {
    e.preventDefault();
    const username = form.username.trim();
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!username || !name) {
      setError('用户名和姓名不能为空');
      return;
    }
    // 编辑时排除自己，避免把自己也算作重复
    const duplicate = accounts.some(
      (a) => a.username === username && a.id !== editingId
    );
    if (duplicate) {
      setError('该用户名已存在，请换一个');
      return;
    }
    // 要发给后端的数据（不含 id，id 由后端生成）
    const data = { username, name, role: form.role, phone };
    try{
      if (editingId) {
        // 更新账号
        const res=await fetch(`/api/accounts/${editingId}`,{
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify(data),
          }
        );
        const updated=await res.json();
        setAccounts((prev)=>prev.map((a)=>(a.id===editingId?updated:a)));
      } else {
        // 新增账号
        const res=await fetch('/api/accounts',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(data),
        });
        if(!res.ok){
          const errData=await res.json();
          setError(errData.message || '创建失败');
          return;
        }
        const created=await res.json();
        setAccounts((prev)=>[created,...prev]);
      }

      setForm({ username: '', name: '', role: '收银员', phone: '' });
      setEditingId(null);
      setError('');
    }catch(err){
      setError("请求失败"+err.message);
    }
  }

  // 点「编辑」：把该账号回填到表单
  function handleEdit(a) {
    setEditingId(a.id);
    setForm({ username: a.username, name: a.name, role: a.role, phone: a.phone || '' });
    setError('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ username: '', name: '', role: '收银员', phone: '' });
    setError('');
  }

  async function handleDelete(id) {
    if (window.confirm('确定要删除这个账号吗？')) {
      await fetch(`/api/accounts/${id}`,{method:'DELETE'});
      setAccounts((prev)=>prev.filter((a)=>a.id!==id));
      if(id===currentUser.id) onLogout();
    }
  }

  // 查询：过滤关键字
  const keyword = search.trim().toLowerCase();
  const filtered = accounts.filter((a) => {
    if (!keyword) return true;
    return (
      a.username.toLowerCase().includes(keyword) ||
      a.name.toLowerCase().includes(keyword) ||
      a.role.toLowerCase().includes(keyword) ||
      (a.phone || '').includes(keyword)
    );
  });

  return (
    <>
      {/* 非管理员提示 */}
      {!isAdmin && (
        <div className="hint">
          ℹ️ 当前以「{currentUser.name}」身份登录，只有管理员才能新增、编辑、删除账号。
        </div>
      )}

      {/* 创建 / 编辑表单：仅管理员可见 */}
      {isAdmin && (
        <section className="card">
          <h2 className="card-title">{editingId ? '✏️ 编辑账号' : '➕ 创建账号'}</h2>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>
                <span>用户名 *</span>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="登录用户名，如 zhangsan"
                />
              </label>
              <label>
                <span>姓名 *</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="真实姓名"
                />
              </label>
              <label>
                <span>角色</span>
                <select name="role" value={form.role} onChange={handleChange}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>手机号</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="选填"
                />
              </label>
            </div>
            {error && <div className="error">⚠️ {error}</div>}
            <button type="submit" className="btn btn-primary">
              {editingId ? '保存修改' : '创建账号'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                取消
              </button>
            )}
          </form>
        </section>
      )}

      {/* 账号列表（所有人可见） */}
      <section className="card">
        <div className="list-header">
          <h2 className="card-title">📋 账号列表</h2>
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索用户名 / 姓名 / 角色..."
            />
            {search && (
              <button className="clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">🧺 暂无账号，先在上方创建一个吧～</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>用户名</th>
                <th>姓名</th>
                <th>角色</th>
                <th>手机号</th>
                <th>创建时间</th>
                {isAdmin && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.username}</td>
                  <td>{a.name}</td>
                  <td>
                    <span className={`role role-${ROLE_CLASS[a.role] || ''}`}>
                      {a.role}
                    </span>
                  </td>
                  <td>{a.phone || '—'}</td>
                  <td>{a.createdAt}</td>
                  {isAdmin && (
                    <td>
                      <button className="btn btn-edit" onClick={() => handleEdit(a)}>编辑</button>
                      <button className="btn btn-danger" onClick={() => handleDelete(a.id)}>删除</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default AccountManager;
