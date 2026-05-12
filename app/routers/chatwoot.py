from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional, Union, List, Dict, Any
import hmac
import hashlib
from app.db.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter, BackgroundTasks
from app.schemas.chatwoot import ChatwootWebhookPayload
from app.db.models import ChatwootLog
from app.services.chatbot import ChatbotService
from app.utils.setting_config import settings

router = APIRouter(prefix="/chatwoot", tags=["Chatbot"])


@router.get("/hmac/{user_id}")
async def get_hmac_for_user(user_id: int):
    """Chatwoot 위젯 identifier_hash 생성"""
    token = settings.CHATWOOT_HMAC_TOKEN
    if not token:
        return {"identifier_hash": None}
    identifier_hash = hmac.new(
        token.encode(), str(user_id).encode(), hashlib.sha256
    ).hexdigest()
    return {"identifier_hash": identifier_hash}


@router.post("/new-chat/{user_id}")
async def start_new_chat(user_id: int):
    """유저의 현재 열린 대화를 모두 resolve하여 새 채팅을 시작할 수 있게 함"""
    import requests as req
    base_url = settings.CHATWOOT_BASE_URL
    headers = {"api_access_token": settings.API_ACCESS_TOKEN}

    # 해당 유저(contact)의 열린 대화 찾기
    try:
        # identifier로 contact 검색
        search_res = req.get(
            f"{base_url}/contacts/search",
            params={"q": str(user_id), "include_contacts": "true"},
            headers=headers,
            timeout=5,
        )
        contacts = search_res.json().get("payload", [])
        contact_id = None
        for c in contacts:
            if str(c.get("identifier")) == str(user_id):
                contact_id = c["id"]
                break

        if not contact_id:
            return {"status": "no_contact"}

        # contact의 대화 목록 조회
        conv_res = req.get(
            f"{base_url}/contacts/{contact_id}/conversations",
            headers=headers,
            timeout=5,
        )
        conversations = conv_res.json().get("payload", [])

        # 열린 대화를 모두 resolve
        resolved_count = 0
        for conv in conversations:
            if conv.get("status") == "open":
                req.post(
                    f"{base_url}/conversations/{conv['id']}/toggle_status",
                    json={"status": "resolved"},
                    headers=headers,
                    timeout=5,
                )
                resolved_count += 1

        return {"status": "ok", "resolved": resolved_count}
    except Exception as e:
        print(f"❌ 새 채팅 시작 실패: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/history/{user_id}")
async def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """유저의 챗봇 대화 기록 조회"""
    logs = (
        db.query(ChatwootLog)
        .filter(ChatwootLog.user_id == user_id)
        .order_by(ChatwootLog.created_at.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": log.id,
            "conversation_id": log.conversation_id,
            "question": log.question_content,
            "answer": log.answer_content,
            "question_type": log.question_type,
            "created_at": log.created_at,
        }
        for log in logs
    ]

def _is_incoming_message(message_type: Optional[Union[str, int]]) -> bool:
    if message_type == 0:
        return True
    if isinstance(message_type, str):
        return message_type.lower() == "incoming"
    return False

def _extract_conversation_id(payload: ChatwootWebhookPayload) -> Optional[int]:
    if payload.conversation and payload.conversation.id is not None:
        return payload.conversation.id
    return payload.conversation_id

def _extract_question_type(payload: ChatwootWebhookPayload) -> str:
    custom_attribute_sources: list[Dict[str, Any]] = []

    if payload.custom_attributes:
        custom_attribute_sources.append(payload.custom_attributes)

    if payload.conversation and payload.conversation.custom_attributes:
        custom_attribute_sources.append(payload.conversation.custom_attributes)

    for attrs in custom_attribute_sources:
        question_type = attrs.get("question_type")
        if question_type:
            return str(question_type)

    try:
        if payload.additional_attributes and payload.additional_attributes.custom_attributes:
            return payload.additional_attributes.custom_attributes.question_type or "일반"
    except Exception:
        pass

    return "일반"

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
    if not _is_incoming_message(payload.message_type):
        return {"status": "ignored", "reason": "Not an incoming message"}

    # 3. 내용이 비어있으면 처리 안 함
    content = str(payload.content or "").strip()
    if not content:
        return {"status": "ignored", "reason": "Empty content"}

    conversation_id = _extract_conversation_id(payload)
    if conversation_id is None:
        return {"status": "ignored", "reason": "Missing conversation id"}

    # 안전하게 question_type 추출
    q_type = _extract_question_type(payload)

    # sender에서 user_id 추출 (프론트에서 setUser로 설정한 identifier)
    user_id = None
    if payload.sender:
        identifier = payload.sender.get("identifier")
        if identifier:
            try:
                user_id = int(identifier)
            except (ValueError, TypeError):
                pass

    duplicate_cutoff = datetime.now() - timedelta(seconds=5)
    existing_log = (
        db.query(ChatwootLog)
        .filter(
            ChatwootLog.conversation_id == conversation_id,
            ChatwootLog.question_content == content,
            ChatwootLog.question_type == q_type,
            ChatwootLog.created_at >= duplicate_cutoff,
        )
        .order_by(ChatwootLog.id.desc())
        .first()
    )
    if existing_log:
        return {"status": "duplicate_ignored", "saved_id": existing_log.id}

    # DB 저장
    new_log = ChatwootLog(
        conversation_id=conversation_id,
        question_content=content,
        question_type=q_type,
        user_id=user_id
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # 4. 챗봇 응답 프로세스 실행
    chatbot_service = ChatbotService()
    background_tasks.add_task(
        chatbot_service.process_and_reply, 
        conversation_id, 
        content, 
        q_type,
        user_id or 1
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
