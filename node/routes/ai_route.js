const express = require('express')
const router = express.Router()
const axios = require('axios')

// 转发到 Python AI 服务（宝塔部署端口：20801，超时60秒）
const py_axios = axios.create({
    baseURL: "http://127.0.0.1:20801",
    timeout: 60000
})

// ==============================================
// 客户端 AI 接口（7个）
// ==============================================

// 1. AI 商品推荐（商城页）
router.post('/ai/shop_recommend', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/shop_recommend', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【AI商品推荐】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: `AI服务连接失败：${e.message}` })
    }
})

// 2. AI 智能客服（客服页）
router.post('/ai/smart_customer_service', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/smart_customer_service', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【AI智能客服】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 3. AI 宠物健康诊断（宠物档案）
router.post('/ai/pet_health_assessment', async (req, res) => {
    try {
        // 同步修改端口为20801
        const localAxios = axios.create({
            baseURL: "http://127.0.0.1:20801",
            timeout: 60000
        })
        const result = await localAxios.post('/ai/pet_health_assessment', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【宠物健康诊断】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 4. AI 寄养订单智能审核（寄养预约）
router.post('/ai/boarding_order_review', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/boarding_order_review', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【寄养订单审核】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 5. AI 社区内容安全审核（发帖/评论/私信）
router.post('/ai/content_safety_check', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/content_safety_check', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【内容安全审核】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 6. AI 社区发帖文案助手
router.post('/ai/post_writing_assistant', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/post_writing_assistant', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【文案助手】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 7. AI 宠物头像/形象生成
router.post('/ai/pet_avatar_generation', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/pet_avatar_generation', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【宠物头像生成】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// ==============================================
// 商家后台 AI 接口（3个）
// ==============================================

// 8. AI 数据看板总结（订单/用户/销量）
router.post('/ai/data_dashboard_summary', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/data_dashboard_summary', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【数据总结】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 9. AI 异常订单检测（刷单/恶意订单）
router.post('/ai/abnormal_order_detection', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/abnormal_order_detection', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【异常订单检测】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

// 10. AI 商家智能回复模板
router.post('/ai/merchant_reply_assistant', async (req, res) => {
    try {
        const result = await py_axios.post('/ai/merchant_reply_assistant', req.body)
        res.json(result.data)
    } catch (e) {
        console.error("【商家智能回复】转发错误：", e.message)
        res.status(500).json({ code: 500, msg: "AI服务异常" })
    }
})

module.exports = router