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
    chatbot_service = ChatbotService(db)
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

# GPT나 Chatwoot 서버에서 생성된 답변을 최종적으로 DB에 저장할 때 호출
@router.get("/reply/{conversation_id}")
async def get_chatbot_reply(conversation_id: int, db: Session = Depends(get_db)):
    # 해당 대화 ID의 가장 최근 로그를 가져옴
    log = db.query(ChatwootLog)\
            .filter(ChatwootLog.conversation_id == conversation_id)\
            .order_by(ChatwootLog.id.desc())\
            .first()
    
    if not log:
        raise HTTPException(status_code=404, detail="해당 대화의 로그를 찾을 수 없습니다.")

    # 답변이 아직 생성 중인 경우
    if not log.answer_content:
        return {
            "conversation_id": conversation_id,
            "status": "pending",
            "message": "AI가 답변을 생성 중입니다. 잠시 후 다시 시도해주세요."
        }

    # 답변이 완성된 경우
    return {
        "conversation_id": log.conversation_id,
        "status": "completed",
        "question": log.question_content,
        "answer": log.answer_content,
        "type": log.question_type,
        "created_at": log.created_at
    }