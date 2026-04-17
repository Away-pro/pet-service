from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import re
from typing import List, Optional, Dict

# ==============================================
# 服务核心配置（固定端口8000，允许跨域）
# ==============================================
app = FastAPI(title="宠物商城全栈AI服务", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================
# 阿里云API核心配置（你的API Key）
# ==============================================
QWEN_API_KEY = "sk-c5e62918f1ae45c0a75b5cdf7a1e40a1"
TEXT_GENERATION_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"
IMAGE_GENERATION_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"

# ✅ 模型映射完全不动
MODEL_MAPPING = {
    "shop_recommend": "qwen-turbo",
    "smart_customer_service": "qwen-plus",
    "pet_health_assessment": "qwen-max",
    "boarding_order_review": "qwen-long",
    "content_safety_check": "qwen-turbo",
    "post_writing_assistant": "qwen-long",  # 保持高速模型不超时
    "pet_avatar_generation": "wanx-v1",
    "data_dashboard_summary": "qwen-coder",
    "abnormal_order_detection": "qwen-plus",
    "merchant_reply_assistant": "qwen-turbo"
}

# ==============================================
# AI请求函数（完全不动）
# ==============================================
def call_qwen_api(model: str, messages: List[Dict], params: Optional[Dict] = None) -> Dict:
    try:
        if not params:
            params = {
                "temperature": 0.3,
                "max_tokens": 1024,
                "top_p": 0.8
            }
        
        headers = {
            "Authorization": f"Bearer {QWEN_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "input": {"messages": messages},
            "parameters": params
        }
        
        # 超时40秒完全不动
        response = requests.post(TEXT_GENERATION_URL, headers=headers, json=payload, timeout=40)
        
        print(f"API请求状态码：{response.status_code}")
        if response.status_code != 200:
            print(f"API报错详情：{response.text}")
            return {"code": 500, "data": f"AI服务异常（{response.status_code}）"}
        
        result = response.json()
        
        ai_reply = ""
        if "output" in result and "text" in result["output"]:
            ai_reply = result["output"]["text"].strip()
        elif "output" in result and "choices" in result["output"] and len(result["output"]["choices"]) > 0:
            ai_reply = result["output"]["choices"][0]["message"]["content"].strip()
        else:
            return {"code": 500, "data": "AI服务返回结构异常"}
        
        return {
            "code": 200,
            "data": ai_reply,
            "msg": "API调用成功"
        }
    except Exception as e:
        print(f"AI接口异常：{str(e)}，请求模型：{model}")
        return {"code": 500, "data": "AI繁忙，请稍后重试"}

# ==============================================
# 数据模型（完全不动）
# ==============================================
class ShopRecommendRequest(BaseModel):
    user_demand: str = Field(..., min_length=1, description="用户商品需求描述")

class CustomerServiceRequest(BaseModel):
    conversation: List[Dict] = Field(..., description="历史对话记录")
    user_message: str = Field(..., min_length=1, description="用户当前消息")

class PetHealthRequest(BaseModel):
    pet_info: Dict = Field(..., description="宠物基本信息")
    symptoms: str = Field(..., min_length=1, description="宠物症状描述")
    medical_history: Optional[str] = Field(None, description="宠物既往病史")

class BoardingOrderRequest(BaseModel):
    order_info: Dict = Field(..., description="寄养订单完整信息")

class ContentSafetyRequest(BaseModel):
    content: str = Field(..., description="需要审核的内容")
    content_type: str = Field("post", description="内容类型: post/comment/message")

class PostWritingRequest(BaseModel):
    topic: str = Field(..., min_length=1, description="发帖主题")
    content_type: str = Field("community", description="内容类型: community/question/experience")
    tone: str = Field("friendly", description="语气: friendly/professional/humorous")

class PetAvatarRequest(BaseModel):
    pet_type: str = Field(..., description="宠物类型: 狗狗/猫咪/鸟/小宠")
    appearance: str = Field(..., description="宠物外观描述")
    style: str = Field("cartoon", description="头像风格: cartoon/realistic/pixel")

class DataDashboardRequest(BaseModel):
    data: Dict = Field(..., description="需要分析的数据")
    analysis_type: str = Field("summary", description="分析类型: summary/detail/comparison")

class AbnormalOrderRequest(BaseModel):
    order_data: Dict = Field(..., description="订单详细数据")

class MerchantReplyRequest(BaseModel):
    user_message: str = Field(..., description="用户消息")
    context: Optional[str] = Field(None, description="对话上下文")

# ==============================================
# 客户端AI功能（仅修改文案助手，其他完全不动）
# ==============================================

# 1. AI商品推荐（完全不动）
@app.post("/ai/shop_recommend")
async def shop_recommend(request: ShopRecommendRequest):
    try:
        messages = [
            {
                "role": "system",
                "content": """你是专业宠物商城导购，必须严格遵守以下规则：
1. 仅输出标准JSON格式，绝对不能有任何多余文字
2. 必须提取3个参数：petType(狗狗/猫咪/鸟/小宠/通用)、maxPrice(纯数字)、keywords(数组)
3. 输出示例：{"petType":"猫咪","maxPrice":50,"keywords":["玩具"]}
4. 只输出JSON，禁止任何额外内容"""
            },
            {"role": "user", "content": f"用户需求：{request.user_demand}"}
        ]
        
        params = {"result_format": "json", "temperature": 0.01, "max_tokens": 512, "top_p": 0.1}
        result = call_qwen_api(MODEL_MAPPING["shop_recommend"], messages, params)
        
        if result["code"] != 200:
            return result
            
        ai_result = json.loads(result["data"].replace("```json", "").replace("```", "").replace("\n", "").strip())
        required_fields = ["petType", "maxPrice", "keywords"]
        for field in required_fields:
            if field not in ai_result:
                return {"code": 500, "data": f"缺少字段：{field}"}
        ai_result["maxPrice"] = int(ai_result["maxPrice"])
        return {"code": 200, "data": ai_result, "msg": "推荐成功"}
    except Exception as e:
        print(f"商品推荐异常：{e}")
        return {"code": 500, "data": "商品推荐服务异常"}

# AI智能客服（完全不动）
@app.post("/ai/smart_customer_service")
async def smart_customer_service(request: CustomerServiceRequest):
    try:
        if not request.user_message.strip():
            return {"code": 200, "data": "请输入您要咨询的问题~"}
            
        messages = [{
            "role": "system",
            "content": """你是【宠伴朝夕宠物商城】专属AI客服，只回答以下问题：
1. 宠物商品咨询、订单查询、发货、售后、退换货
2. 猫咪/狗狗饲养知识、用品推荐
3. 寄养服务、宠物健康基础咨询
4. 无关问题直接回复：抱歉，我只解答宠物商城相关问题~
回答要求：友好、简洁、纯文本、不用Markdown、不闲聊"""
        }]
        
        for msg in request.conversation:
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ["assistant", "user"] and content:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": request.user_message})
        
        result = call_qwen_api(MODEL_MAPPING["smart_customer_service"], messages)
        return result
    except Exception as e:
        print(f"客服接口异常：{e}")
        return {"code": 200, "data": "AI客服暂时繁忙，请切换人工客服"}

# 3. 宠物健康诊断（完全不动）
@app.post("/ai/pet_health_assessment")
async def pet_health_assessment(request: PetHealthRequest):
    try:
        messages = [
            {"role": "system", "content": """你是资深宠物医生，提供健康评估，语言通俗，最后必须提示：仅供参考，不能替代兽医诊断"""},
            {"role": "user", "content": f"宠物信息：{json.dumps(request.pet_info)}，症状：{request.symptoms}，病史：{request.medical_history or '无'}"}
        ]
        return call_qwen_api(MODEL_MAPPING["pet_health_assessment"], messages)
    except Exception as e:
        print(f"健康诊断异常：{e}")
        return {"code": 500, "data": "健康诊断服务异常"}

# 4. 寄养订单审核（完全不动）
@app.post("/ai/boarding_order_review")
async def boarding_order_review(request: BoardingOrderRequest):
    try:
        messages = [
            {"role": "system", "content": """输出JSON：{"review_result":"approve/reject","reason":"","suggestions":[]}"""},
            {"role": "user", "content": f"订单：{json.dumps(request.order_info)}"}
        ]
        params = {"result_format": "json", "temperature": 0.3}
        result = call_qwen_api(MODEL_MAPPING["boarding_order_review"], messages, params)
        if result["code"] != 200:
            return result
        return {"code":200,"data":json.loads(result["data"].replace("```json","").replace("```","").strip()),"msg":"审核完成"}
    except Exception as e:
        print(f"订单审核异常：{e}")
        return {"code": 500, "data": "订单审核异常"}

# 5. 内容审核（完全不动）
@app.post("/ai/content_safety_check")
async def content_safety_check(request: ContentSafetyRequest):
    try:
        messages = [
            {"role": "system", "content": """输出JSON：{"is_safe":true/false,"risk_level":"low/medium/high","risk_type":"","suggestion":""}"""},
            {"role": "user", "content": f"类型：{request.content_type}，内容：{request.content}"}
        ]
        params = {"result_format": "json", "temperature": 0.01}
        result = call_qwen_api(MODEL_MAPPING["content_safety_check"], messages, params)
        if result["code"] != 200:
            return result
        return {"code":200,"data":json.loads(result["data"].replace("```json","").replace("```","").strip()),"msg":"审核完成"}
    except Exception as e:
        print(f"内容审核异常：{e}")
        return {"code": 500, "data": "内容审核异常"}

# ==============================================
# ✅ 仅修改这一个文案助手函数，其他完全不动
# ==============================================
@app.post("/ai/post_writing_assistant")
async def post_writing_assistant(request: PostWritingRequest):
    try:
        # 提取用户要求的字数，让AI精准响应
        word_count_match = re.search(r'(\d+)字', request.topic)
        word_count_prompt = f"生成约{word_count_match.group(1)}字，内容饱满完整，不要过短" if word_count_match else "生成自然长度，内容饱满"

        messages = [
            {
                "role": "system",
                "content": f"""严格100%按用户要求创作，只输出固定格式，无任何多余内容、闲聊：
【标题】：15字以内，吸睛贴合养宠主题
【内容】：{word_count_prompt}，语气{request.tone}，100%围绕用户主题，内容生动有温度，适合养宠社区分享
【话题】：3个与主题强相关的关键词，空格分隔，无#号、无多余符号
仅输出以上三部分，禁止任何额外解释、Markdown"""
            },
            {"role": "user", "content": f"发帖主题+需求：{request.topic}"}
        ]
        # 适配长文案的快速生成参数（保持qwen-turbo 不超时）
        params = {
            "temperature": 0.3,
            "max_tokens": 2048,
            "top_p": 0.5
        }
        return call_qwen_api(MODEL_MAPPING["post_writing_assistant"], messages, params)
    except Exception as e:
        print(f"文案助手异常：{e}")
        return {"code": 500, "data": "文案生成失败，请重试"}

# 7. 宠物头像生成（完全不动）
@app.post("/ai/pet_avatar_generation")
async def pet_avatar_generation(request: PetAvatarRequest):
    try:
        headers = {"Authorization": f"Bearer {QWEN_API_KEY}", "Content-Type": "application/json"}
        prompt = f"一只{request.pet_type}，{request.appearance}，{request.style}风格，高清头像，纯色背景"
        payload = {"model": MODEL_MAPPING["pet_avatar_generation"], "input": {"prompt": prompt}, "parameters": {"size": "512x512", "n": 1}}
        response = requests.post(IMAGE_GENERATION_URL, headers=headers, json=payload, timeout=40)
        response.raise_for_status()
        result = response.json()
        return {"code":200,"data":{"image_url":result["output"]["images"][0]},"msg":"生成成功"}
    except Exception as e:
        print(f"头像生成异常：{e}")
        return {"code": 500, "data": "头像生成失败"}

# ==============================================
# 商家后台AI功能（完全不动）
# ==============================================

# 8. 数据总结（完全不动）
@app.post("/ai/data_dashboard_summary")
async def data_dashboard_summary(request: DataDashboardRequest):
    try:
        messages = [
            {"role": "system", "content": f"数据{request.analysis_type}分析，简洁易懂，给业务建议"},
            {"role": "user", "content": f"数据：{json.dumps(request.data)}"}
        ]
        return call_qwen_api(MODEL_MAPPING["data_dashboard_summary"], messages)
    except Exception as e:
        print(f"数据总结异常：{e}")
        return {"code": 500, "data": "数据总结异常"}

# 9. 异常订单检测（完全不动）
@app.post("/ai/abnormal_order_detection")
async def abnormal_order_detection(request: AbnormalOrderRequest):
    try:
        messages = [
            {"role": "system", "content": """输出JSON：{"is_abnormal":true/false,"risk_type":"","confidence":0-100,"suggestion":""}"""},
            {"role": "user", "content": f"订单：{json.dumps(request.order_data)}"}
        ]
        params = {"result_format": "json", "temperature": 0.1}
        result = call_qwen_api(MODEL_MAPPING["abnormal_order_detection"], messages, params)
        if result["code"] != 200:
            return result
        return {"code":200,"data":json.loads(result["data"].replace("```json","").replace("```","").strip()),"msg":"检测完成"}
    except Exception as e:
        print(f"订单检测异常：{e}")
        return {"code": 500, "data": "订单检测异常"}

# 10. 商家回复助手（完全不动）
@app.post("/ai/merchant_reply_assistant")
async def merchant_reply_assistant(request: MerchantReplyRequest):
    try:
        messages = [
            {"role": "system", "content": "商家客服专业回复模板，纯文本，可直接使用"},
            {"role": "user", "content": f"用户消息：{request.user_message}，上下文：{request.context or '无'}"}
        ]
        return call_qwen_api(MODEL_MAPPING["merchant_reply_assistant"], messages)
    except Exception as e:
        print(f"商家回复异常：{e}")
        return {"code": 500, "data": "回复生成异常"}
    
#11
@app.post("/ai/wx")
async def smart_customer_service(request: CustomerServiceRequest):
    try:
        if not request.user_message.strip():
            return {"code": 200, "data": "请输入您要咨询的问题~"}
            
        messages = [{
            "role": "system",
            "content": """你是【宠伴朝夕宠物商城】专属AI客服，只回答以下问题：
1. 宠物商品咨询、订单查询、发货、售后、退换货
2. 猫咪/狗狗饲养知识、用品推荐
3. 寄养服务、宠物健康基础咨询
4. 无关问题直接回复：抱歉，我只解答宠物商城相关问题~
回答要求：友好、简洁、纯文本、不用Markdown、不闲聊"""
        }]
        
        for msg in request.conversation:
            role = msg.get("role")
            content = msg.get("content", "")
            if role in ["assistant", "user"] and content:
                messages.append({"role": role, "content": content})
        
        messages.append({"role": "user", "content": request.user_message})
        
        result = call_qwen_api(MODEL_MAPPING["smart_customer_service"], messages)
        return result
    except Exception as e:
        print(f"客服接口异常：{e}")
        return {"code": 200, "data": "AI客服暂时繁忙，请切换人工客服"}

# 健康检查（完全不动）
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "AI服务运行正常"}

# 启动（完全不动）
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)