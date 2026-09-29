// 可选角色
export const ROLES = ['管理员', '收银员', '仓库管理员'];

// 角色 -> 样式类名（用于显示不同颜色标签）
export const ROLE_CLASS = {
  管理员: 'admin',
  收银员: 'cashier',
  仓库管理员: 'warehouse',
};

// 生成本地唯一 id
export function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
