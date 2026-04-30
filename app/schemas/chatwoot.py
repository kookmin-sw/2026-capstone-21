from pydantic import BaseModel, Field
from typing import Optional

class CustomAttributes(BaseModel):
    question_type: Optional[str] = "일반"

    class Config:
        extra = "ignore"  # 정의되지 않은 다른 커스텀 속성들은 무시

class AdditionalAttributes(BaseModel):
    custom_attributes: Optional[CustomAttributes] = None

    class Config:
        extra = "ignore"

class ConversationInfo(BaseModel):
    id: int

    class Config:
        extra = "ignore"

class ChatwootWebhookPayload(BaseModel):
    content: str
    message_type: str
    additional_attributes: Optional[AdditionalAttributes] = None
    conversation: ConversationInfo

    class Config:
        extra = "ignore"  # Chatwoot이 쏘는 수많은 다른 필드들을 다 무시함
        
class ChatwootMessage(BaseModel):
    content: str
    question_type: str
    conversation_id: int

class ChatbotResponse(BaseModel):
    reply: str
    conversation_id: int