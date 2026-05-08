from __future__ import annotations
from typing import Optional, Union, List, Dict
from app.db.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter, BackgroundTasks
from app.schemas.chatwoot import ChatwootWebhookPayload
from app.db.models import ChatwootLog
from app.services.chatbot import ChatbotService

router = APIRouter(prefix="/chatwoot", tags=["Chatbot"])

@router.post("/webhook")
async def receive_question(
    payload: ChatwootWebhookPayload, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
# 1. '메시지 생성' 이벤트가 아니면 아예 무시 (핵심!)
    # Chatwoot이 보내는 온갖 알림(읽음 확인, 타이핑 등)을 여기서 다 걸러냅니다.
    if payload.event != "message_created":
        return {"status": "ignored", "reason": f"Event '{payload.event}' is not handled"}

    # 2. '유저가 보낸(incoming)' 메시지가 아니면 무시
    # 내가(봇이) 보낸 답장 웹훅이 다시 나에게 돌아오는 '무한 루프' 방지
    if payload.message_type != "incoming":
        return {"status": "ignored", "reason": "Not an incoming message"}

    # 3. 내용이 비어있으면 처리 안 함
    if not payload.content or not payload.content.strip():
        return {"status": "ignored", "reason": "Empty content"}

    # 안전하게 question_type 추출
    q_type = "일반"
    try:
        if payload.additional_attributes and payload.additional_attributes.custom_attributes:
            q_type = payload.additional_attributes.custom_attributes.question_type or "일반"
    except Exception:
        q_type = "일반"

    # DB 저장
    new_log = ChatwootLog(
        conversation_id=payload.conversation.id,
        question_content=payload.content,
        question_type=q_type
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # 4. 챗봇 응답 프로세스 실행
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