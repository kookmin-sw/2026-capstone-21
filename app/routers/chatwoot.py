from app.utils.setting_config import settings
import os
from app.db.database import get_db
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, APIRouter
from app.schemas.chatwoot import ChatwootWebhookPayload, ChatwootMessage, ChatbotResponse
from app.db.models import ChatwootLog

router = APIRouter(prefix="/chatwoot", tags=["Chatbot"])

# --- 1. 유저 질문 수신 (POST) ---
# Chatwoot 위젯에서 유저가 질문을 입력하면 호출됨
@router.post("/webhook")
async def receive_question(payload: ChatwootWebhookPayload, db: Session = Depends(get_db)):
    q_type = "일반"
    if payload.additional_attributes and payload.additional_attributes.custom_attributes:
        q_type = payload.additional_attributes.custom_attributes.question_type

    # 2. DB 모델 객체 생성 (매핑 확인!)
    new_log = ChatwootLog(
        conversation_id=payload.conversation.id,
        question_content=payload.content,
        question_type=q_type
        # answer_content는 나중에 GPT 답변 오면 업데이트!
    )

    # 3. DB에 저장
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    print(f"✅ DB 저장 성공: ID {new_log.id}")
    return {"status": "success", "saved_id": new_log.id}

# --- 2. Chatwoot 서버로 데이터 전송 (GET) ---
# 백엔드에 쌓인 질문이나 상태를 Chatwoot 서버가 조회하거나 확인할 때 사용
@router.get("/transfer/{conversation_id}")
async def get_question_status(conversation_id: int, db: Session = Depends(get_db)):
    log = db.query(ChatwootLog).filter(ChatwootLog.conversation_id == conversation_id).first()
    
    # 특정 대화방의 질문 데이터를 조회하여 전달
    if not log:
        return {"status": "error", "message": "해당 ID의 로그가 없습니다."}

    return {
        "conversation_id": log.conversation_id,
        "question": log.question_content,
        "type": log.question_type,
        "time": log.created_at
    }

# --- 3. Chatwoot 답변 저장 (POST) ---
# GPT나 Chatwoot 서버에서 생성된 답변을 최종적으로 DB에 저장할 때 호출
@router.post("/save-reply")
async def save_chatbot_reply(data: ChatbotResponse):
    log = db.query(ChatwootLog).filter(ChatwootLog.conversation_id == data.conversation_id).order_by(ChatwootLog.id.desc()).first()
    
    if log:
        log.answer_content = data.reply
        db.commit()
        print(f"답변 업데이트 완료 (ID: {data.conversation_id})")
        return {"status": "updated", "conversation_id": data.conversation_id}
    else:
        return {"status": "error", "message": "질문 로그를 찾을 수 없습니다."}