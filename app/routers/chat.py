"""Chatwoot 채팅 프록시 API - 프론트엔드 자체 채팅 UI용"""
from typing import Optional
from fastapi import APIRouter
import requests
from app.utils.setting_config import settings

router = APIRouter(prefix="/chat", tags=["Chat"])

CHATWOOT_URL = f"{settings.CHATWOOT_BASE_URL}"
HEADERS = {"api_access_token": settings.API_ACCESS_TOKEN}
ACCOUNT_ID = 1


def _get_contact_id(user_id) -> Optional[int]:
    """user_id(identifier)로 Chatwoot contact_id 조회. 없으면 생성."""
    identifier = str(user_id)
    res = requests.get(
        f"{CHATWOOT_URL}/contacts/search",
        params={"q": identifier},
        headers=HEADERS,
        timeout=5,
    )
    for c in res.json().get("payload", []):
        if str(c.get("identifier")) == identifier:
            return c["id"]

    # contact가 없으면 생성
    name = f"Guest ({identifier[-6:]})" if identifier.startswith("guest_") else f"user_{identifier}"
    create_res = requests.post(
        f"{CHATWOOT_URL}/contacts",
        json={"identifier": identifier, "name": name},
        headers=HEADERS,
        timeout=5,
    )
    if create_res.status_code in (200, 201):
        return create_res.json().get("id")
    return None


@router.get("/conversations/{user_id}")
async def get_conversations(user_id: str):
    """유저의 대화 목록 조회"""
    contact_id = _get_contact_id(user_id)
    if not contact_id:
        return {"conversations": []}

    res = requests.get(
        f"{CHATWOOT_URL}/contacts/{contact_id}/conversations",
        headers=HEADERS,
        timeout=5,
    )
    convs = res.json().get("payload", [])

    return {
        "conversations": [
            {
                "id": c["id"],
                "status": c.get("status", "open"),
                "created_at": c.get("created_at"),
                "last_message": c.get("messages", [{}])[-1].get("content", "") if c.get("messages") else "",
                "name": c.get("custom_attributes", {}).get("chat_name", ""),
            }
            for c in convs
        ]
    }


@router.get("/messages/{conversation_id}")
async def get_messages(conversation_id: int):
    """특정 대화의 메시지 목록 조회"""
    res = requests.get(
        f"{CHATWOOT_URL}/conversations/{conversation_id}/messages",
        headers=HEADERS,
        timeout=5,
    )
    data = res.json()
    messages = data.get("payload", [])

    return {
        "messages": [
            {
                "id": m["id"],
                "content": m.get("content", ""),
                "message_type": m.get("message_type"),  # 0=incoming, 1=outgoing, 2=activity
                "created_at": m.get("created_at"),
                "sender_type": m.get("sender_type"),
            }
            for m in messages
            if m.get("message_type") != 2  # activity 메시지 제외
        ]
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int):
    """대화 삭제"""
    requests.post(
        f"{CHATWOOT_URL}/conversations/{conversation_id}/toggle_status",
        json={"status": "resolved"},
        headers=HEADERS,
        timeout=5,
    )
    return {"status": "ok"}


@router.patch("/conversations/{conversation_id}/name")
async def rename_conversation(conversation_id: int, body: dict):
    """대화 이름 수정"""
    name = body.get("name", "").strip()
    if not name:
        return {"error": "empty name"}
    requests.patch(
        f"{CHATWOOT_URL}/conversations/{conversation_id}",
        json={"custom_attributes": {"chat_name": name}},
        headers=HEADERS,
        timeout=5,
    )
    return {"status": "ok"}


@router.post("/send/{conversation_id}")
async def send_message(conversation_id: int, body: dict):
    """메시지 전송 - Chatwoot에 기록하고 챗봇 응답 생성"""
    from fastapi import BackgroundTasks
    content = body.get("content", "").strip()
    user_id = body.get("user_id")
    if not content:
        return {"error": "empty content"}

    # 질문 유형 메시지인 경우 conversation custom_attributes에 설정
    q_type = "일반"
    if content in ("인플루언서 추천", "사이트 이용 관련"):
        q_type = content
        requests.patch(
            f"{CHATWOOT_URL}/conversations/{conversation_id}",
            json={"custom_attributes": {"question_type": content}},
            headers=HEADERS,
            timeout=5,
        )

    # Chatwoot에 유저 메시지를 outgoing(봇 관점)이 아닌, 
    # Public API로 contact 메시지 전송
    # WebWidget inbox에서는 contact_inbox의 source_id가 필요
    # 대신: conversation에 직접 activity가 아닌 방식으로 기록
    # → Chatwoot Client API 사용
    website_token = "jiCv8RLjjRupHCDz7zsKy8Hi"

    # contact의 source_id 조회
    conv_res = requests.get(
        f"{CHATWOOT_URL}/conversations/{conversation_id}",
        headers=HEADERS,
        timeout=5,
    )
    conv_data = conv_res.json()
    contact_id = conv_data.get("meta", {}).get("sender", {}).get("id")

    source_id = None
    if contact_id:
        contact_res = requests.get(
            f"{CHATWOOT_URL}/contacts/{contact_id}",
            headers=HEADERS,
            timeout=5,
        )
        for ci in contact_res.json().get("contact_inboxes", []):
            if ci.get("inbox", {}).get("id") == 1:
                source_id = ci.get("source_id")
                break

    # Public API로 메시지 전송 (contact로서)
    if source_id:
        public_url = f"http://localhost:3000/public/api/v1/inboxes/{website_token}/contacts/{source_id}/conversations/{conversation_id}/messages"
        requests.post(
            public_url,
            json={"content": content},
            timeout=5,
        )
    
    # 챗봇 응답 생성 (백그라운드)
    from app.services.chatbot import ChatbotService
    from app.db.models import ChatwootLog
    from app.db.database import SessionLocal

    # DB에 로그 저장
    numeric_user_id = None
    if user_id:
        try:
            numeric_user_id = int(user_id)
        except (ValueError, TypeError):
            pass

    with SessionLocal() as db:
        new_log = ChatwootLog(
            conversation_id=conversation_id,
            question_content=content,
            question_type=q_type,
            user_id=numeric_user_id,
        )
        db.add(new_log)
        db.commit()

    # 챗봇 응답 처리
    chatbot = ChatbotService()
    chatbot.process_and_reply(conversation_id, content, q_type, numeric_user_id or 1)

    return {"status": "ok"}


@router.post("/new/{user_id}")
async def create_conversation(user_id: str, question_type: str = "일반"):
    """새 대화 생성"""
    contact_id = _get_contact_id(user_id)
    if not contact_id:
        return {"error": "contact not found"}

    # 기존 열린 대화 resolve
    convs_res = requests.get(
        f"{CHATWOOT_URL}/contacts/{contact_id}/conversations",
        headers=HEADERS,
        timeout=5,
    )
    for c in convs_res.json().get("payload", []):
        if c.get("status") == "open":
            requests.post(
                f"{CHATWOOT_URL}/conversations/{c['id']}/toggle_status",
                json={"status": "resolved"},
                headers=HEADERS,
                timeout=5,
            )

    # 새 대화 생성
    res = requests.post(
        f"{CHATWOOT_URL}/conversations",
        json={
            "contact_id": contact_id,
            "inbox_id": 1,
            "status": "open",
            "custom_attributes": {"question_type": question_type},
        },
        headers=HEADERS,
        timeout=5,
    )
    data = res.json()
    return {"conversation_id": data.get("id")}
