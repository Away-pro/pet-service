import { createRouter, createWebHistory } from "vue-router"

// 登录页
import Login from "../views/Login.vue"
// 后台布局框架
import Layout from "../views/Layout.vue"

// 路由统一使用懒加载
const Dashboard = () => import("../views/Index.vue") 
const Product = () => import("../views/Product.vue")
const Category = () => import("../views/Category.vue")
const Order = () => import("../views/Order.vue")
const Pet = () => import("../views/Pet.vue")
const Foster = () => import("../views/Foster.vue")
const User = () => import("../views/User.vue")
const AdminService = () => import('../views/AdminService.vue')
const PostManage = () => import("../views/Community/PostManage.vue")
const CommentManage = () => import("../views/Community/CommentManage.vue")
const ActivityManage = () => import("../views/Community/ActivityManage.vue")
const CommunityUser = () => import("../views/Community/UserManage.vue")

const routes = [
  // 登录页（公开访问）
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "管理员登录" }
  },

  // 后台主布局（需要登录）
  {
    path: "/",
    component: Layout,
    redirect: "/dashboard",
    children: [
      // 数据统计大盘（默认首页）
      {
        path: "dashboard",
        name: "Dashboard",
        component: Dashboard,
        meta: { title: "数据概览", requiresAuth: true }
      },
      // 商品管理
      {
        path: "product",
        name: "Product",
        component: Product,
        meta: { title: "商品管理", requiresAuth: true }
      },
      // 分类管理
      {
        path: "category",
        name: "Category",
        component: Category,
        meta: { title: "分类管理", requiresAuth: true }
      },
      // 订单管理
      {
        path: "order",
        name: "Order",
        component: Order,
        meta: { title: "订单管理", requiresAuth: true }
      },
      // 宠物档案
      {
        path: "pet",
        name: "Pet",
        component: Pet,
        meta: { title: "宠物档案管理", requiresAuth: true }
      },
      // 寄养预约
      {
        path: "foster",
        name: "Foster",
        component: Foster,
        meta: { title: "寄养预约管理", requiresAuth: true }
      },
      // 客服中心
      {
        path: "admin-service",
        name: "AdminService",
        component: AdminService,
        meta: { title: "客服中心", requiresAuth: true }
      },
      // 用户管理
      {
        path: "user",
        name: "User",
        component: User,
        meta: { title: "用户管理", requiresAuth: true }
      },
      {
        path: "community/post",
        name: "PostManage",
        component: PostManage,
        meta: { title: "动态管理", requiresAuth: true }
      },
      {
        path: "community/comment",
        name: "CommentManage",
        component: CommentManage,
        meta: { title: "评论管理", requiresAuth: true }
      },
      {
        path: "community/activity",
        name: "ActivityManage",
        component: ActivityManage,
        meta: { title: "活动管理", requiresAuth: true }
      },
      {
        path: "community/user",
        name: "CommunityUser",
        component: CommunityUser,
        meta: { title: "社区用户管理", requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from) => {
  const token = localStorage.getItem("token")
  document.title = to.meta.title || "宠物寄养&用品商城管理系统"

  if (token && to.path === "/login") {
    return "/dashboard"
  }
  if (to.meta.requiresAuth && !token) {
    return "/login"
  }
})

export default router