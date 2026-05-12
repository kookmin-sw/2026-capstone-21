from __future__ import annotations
from typing import Optional, Any, Dict, Union
from pydantic import BaseModel, Field

class CustomAttributes(BaseModel):
    question_type: Optional[str] = Field(default="일반")

    class Config:
        extra = "ignore"

class AdditionalAttributes(BaseModel):
    custom_attributes: Optional[CustomAttributes] = Field(default_factory=CustomAttributes)

    class Config:
        extra = "ignore"

class ConversationInfo(BaseModel):
    id: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        extra = "ignore"

class ChatwootWebhookPayload(BaseModel):
    # content가 없을 때 에러나지 않게 Optional 설정
    content: Optional[str] = ""
    message_type: Optional[Union[str, int]] = ""
    # 이벤트 종류를 파악하기 위해 추가
    event: Optional[str] = None
    id: Optional[int] = None
    conversation_id: Optional[int] = None
    custom_attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)
    additional_attributes: Optional[AdditionalAttributes] = Field(default_factory=AdditionalAttributes)
    conversation: Optional[ConversationInfo] = None
    sender: Optional[Dict[str, Any]] = None

    class Config:
        extra = "ignore"
