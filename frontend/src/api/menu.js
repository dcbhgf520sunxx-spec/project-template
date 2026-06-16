import request from './request'

export const getMenus = () => request.get('/api/menus')
export const getUserMenus = (userId) => request.get(`/api/menus/user/${userId}`)
export const getRoleMenus = (roleId) => request.get(`/api/menus/role/${roleId}`)
export const saveRoleMenus = (roleId, menuIds, updaterId) => request.put(`/api/menus/role/${roleId}`, { menuIds, updater_id: updaterId })
