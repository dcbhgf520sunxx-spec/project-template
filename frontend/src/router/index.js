import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    redirect: '/work-orders',
    children: [
      {
        path: 'dashboard',
        redirect: '/work-orders'
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/user/list.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'users/add',
        name: 'UserAdd',
        component: () => import('../views/user/form.vue'),
        meta: { title: '新增用户' }
      },
      {
        path: 'users/edit/:id',
        name: 'UserEdit',
        component: () => import('../views/user/form.vue'),
        meta: { title: '编辑用户' }
      },
      {
        path: 'users/detail/:id',
        name: 'UserDetail',
        component: () => import('../views/user/detail.vue'),
        meta: { title: '用户详情' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../views/role/list.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'roles/add',
        name: 'RoleAdd',
        component: () => import('../views/role/form.vue'),
        meta: { title: '新增角色' }
      },
      {
        path: 'roles/edit/:id',
        name: 'RoleEdit',
        component: () => import('../views/role/form.vue'),
        meta: { title: '编辑角色' }
      },
      {
        path: 'roles/detail/:id',
        name: 'RoleDetail',
        component: () => import('../views/role/detail.vue'),
        meta: { title: '角色详情' }
      },
      {
        path: 'archive',
        name: 'Archive',
        component: () => import('../views/archive/index.vue'),
        meta: { title: '基础档案' }
      },
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('../views/workOrder/list.vue'),
        meta: { title: '运维工单' }
      },
      {
        path: 'work-orders/add',
        name: 'WorkOrderAdd',
        component: () => import('../views/workOrder/form.vue'),
        meta: { title: '新增工单' }
      },
      {
        path: 'work-orders/copy/:id',
        name: 'WorkOrderCopy',
        component: () => import('../views/workOrder/form.vue'),
        meta: { title: '复制工单' }
      },
      {
        path: 'work-orders/edit/:id',
        name: 'WorkOrderEdit',
        component: () => import('../views/workOrder/form.vue'),
        meta: { title: '编辑工单' }
      },
      {
        path: 'work-orders/detail/:id',
        name: 'WorkOrderDetail',
        component: () => import('../views/workOrder/detail.vue'),
        meta: { title: '工单详情' }
      },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Auth guard
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.name === 'Login') {
    return token ? '/work-orders' : true
  }
  if (!token) return '/login'
  return true
})

export default router
