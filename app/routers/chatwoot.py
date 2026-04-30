from app.utils.setting_config import settings
import os
from app.db.database import get_db
from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, APIRouter, BackgroundTasks
from app.schemas.chatwoot import ChatwootWebhookPayload, ChatwootMessage, ChatbotResponse
from app.db.models import ChatwootLog
from app.services.chatbot import ChatbotService

router = APIRouter(prefix="/chatwoot", tags=["Chatbot"])

@router.post("/webhook")
async def receive_question(
    payload: ChatwootWebhookPayload, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    if payload.message_type != "incoming":
        return {"status": "ignored", "message": "Not an incoming message"}
    # 기존 DB 저장 로직
    q_type = "일반"
    if payload.additional_attributes and payload.additional_attributes.custom_attributes:
        q_type = payload.additional_attributes.custom_attributes.question_type

    new_log = ChatwootLog(
        conversation_id=payload.conversation.id,
        question_content=payload.content,
        question_type=q_type
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # --- 백그라운드 태스크로 AI 답변 로직 실행 ---
    # 사용자가 대기하지 않도록 비동기로 처리합니다.
    chatbot_service = ChatbotService()
    background_tasks.add_task(
        chatbot_service.process_and_reply, 
        payload.conversation.id, 
        payload.content, 
        q_type
    )

    return {"status": "processing", "saved_id": new_log.id}

# 백엔드에 쌓인 질문이나 상태를 Chatwoot 서버가 조회하거나 확인할 때 사용
@router.get("/transfer/{conversation_id}")
async def get_question_status(conversation_id: int, db: Session = Depends(get_db)):
    log = db.query(ChatwootLog).filter(ChatwootLog.conversation_id == conversation_id).order_by(ChatwootLog.id.desc()).first()
    
    # 특정 대화방의 질문 데이터를 조회하여 전달
    if not log:
        return {"status": "error", "message": "해당 ID의 로그가 없습니다."}

    status = "completed" if log.answer_content else "pending"

return {
        "conversation_id": log.conversation_id,
        "status": status,
        "question": log.question_content,
        "answer": log.answer_content,
        "type": log.question_type,
        "created_at": log.created_at,
        "answered_at": log.answered_at
    }