import { createRouter, createWebHistory } from "vue-router"

const Home = () => import("../views/Home.vue")
const Login = () => import("../views/Login.vue")
const Goods = () => import("../views/Goods.vue")
const Foster = () => import("../views/Foster.vue")
const User = () => import("../views/User.vue")
const PetAdd = () => import("../views/PetApp.vue")
const Cart = () => import("../views/Cart.vue")
const GoodsDetail = () => import("../views/GoodsDetail.vue")
const Community = () => import('../views/community/Community.vue')
const CommunityPost = () => import('../views/community/CommunityPost.vue')
const CommunityDetail = () => import('../views/community/CommunityDetail.vue')
const CommunityProfile = () => import('../views/community/CommunityProfile.vue')
const CommunityPostEdit = () => import('../views/community/CommunityPostEdit.vue')
const CustomerService = () => import('../views/CustomerService.vue')
const ThreeDGoodsDetail = () => import('../views/3dGoodsDetail.vue')
const Address = () => import("../views/Address.vue")
const Order = () => import("../views/Order.vue")
const OrderConfirm = () => import("../views/OrderConfirm.vue")

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", component: Home, meta: { title: "首页" } },
  { path: "/login", component: Login, meta: { title: "用户登录" } },
  // 需要登录才能访问的页面（统一格式）
  { path: "/goods", component: Goods, meta: { title: "宠物用品", requiresAuth: true } },
  { path: "/goods/:id", component: GoodsDetail, meta: { title: "商品详情", requiresAuth: true } },
  { path: "/3d-goods/", component: ThreeDGoodsDetail, meta: { title: "3D商品详情", requiresAuth: true } },
  { path: "/foster", component: Foster, meta: { title: "宠物寄养", requiresAuth: true } },
  { path: "/pet-add", component: PetAdd, meta: { title: "宠物档案", requiresAuth: true } },
  { path: "/user", component: User, meta: { title: "个人中心", requiresAuth: true } },
  { path: "/cart", component: Cart, meta: { title: "我的购物车", requiresAuth: true } },
  { path: "/order-confirm", component: OrderConfirm, meta: { title: "确认订单", requiresAuth: true } },
  { path: "/service", component: CustomerService, meta: { title: "在线客服", requiresAuth: true } },
  // 收货地址 + 我的订单
  { path: "/address", component: Address, meta: { title: "收货地址", requiresAuth: true } },
  { path: "/order", component: Order, meta: { title: "我的订单", requiresAuth: true } },
  // 宠伴社区全套路由
  { path: "/community", component: Community, meta: { title: "宠伴社区", requiresAuth: true } },
  { path: "/community/post", component: CommunityPost, meta: { title: "发布动态", requiresAuth: true } },
  { path: "/community/detail/:id", component: CommunityDetail, meta: { title: "动态详情", requiresAuth: true } },
  { path: "/community/profile", component: CommunityProfile, meta: { title: "社区主页", requiresAuth: true } },
  { path: "/community/message", component: () => import('../views/community/MessagePage.vue'), meta: { title: "消息中心", requiresAuth: true } },
  { path: '/community/profile/edit', component: () => import('../views/community/CommunityProfileEdit.vue'), meta: { title: '编辑主页', requiresAuth: true } },
  { path: "/community/post/edit/:id", component: CommunityPostEdit, meta: { title: "编辑动态", requiresAuth: true } },
  { path: "/community/activity/:id", component: () => import('../views/community/ActivityDetail.vue'), meta: { title: "活动详情", requiresAuth: true } },
  { path: "/community/profile/:id", component: () => import('../views/community/UserProfile.vue'), meta: { title: "用户主页", requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 登录拦截 + 页面标题
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('userToken')
  const userInfo = localStorage.getItem('userInfo')
  const isAuth = !!(token && userInfo)

  // 白名单：无需登录
  const whiteList = ['/home', '/login']
  if (whiteList.includes(to.path)) {
    next()
    return
  }

  // 需要登录的页面
  if (isAuth) {
    next()
  } else {
    next('/login')
  }
})

export default router