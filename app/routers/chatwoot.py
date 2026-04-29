from app.utils.setting_config import settings
import os
from fastapi import FastAPI, Depends
from app.schemas.chatwoot import ChatwootMessage

router = APIRouter(prefix="/chatwoot", tags=["Chatbot"])

# --- 1. 유저 질문 수신 (POST) ---
# Chatwoot 위젯에서 유저가 질문을 입력하면 호출됨
@router.post("/webhook")
async def receive_question(data: ChatwootWebhook):
    # ChatwootWebhook 모델에 데이터가 자동으로 파싱되어 들어옴
    print(f"질문 수신 완료: {data.content} (ID: {data.conversation_id})")
    return {"status": "success", "received": data}

# --- 2. Chatwoot 서버로 데이터 전송 (GET) ---
# 백엔드에 쌓인 질문이나 상태를 Chatwoot 서버가 조회하거나 확인할 때 사용
@router.get("/transfer/{conversation_id}")
async def get_question_status(conversation_id: int):
    # 특정 대화방의 질문 데이터를 조회하여 전달
    return {
        "conversation_id": conversation_id,
        "status": "processing",
        "message": "데이터 전송 준비 완료"
    }

# --- 3. Chatwoot 답변 저장 (POST) ---
# GPT나 Chatwoot 서버에서 생성된 답변을 최종적으로 DB에 저장할 때 호출
@router.post("/save-reply")
async def save_chatbot_reply(data: ChatbotResponse):
    # 여기서 DB에 답변을 insert 하는 로직을 넣으면 됨
    print(f"답변 저장 완료: {data.reply} (ID: {data.conversation_id})")
    return {"status": "saved", "conversation_id": data.conversation_id}