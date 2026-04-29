from pydantic import BaseModel
from typing import Optional

class ChatwootWebhook(BaseModel):
    content: str
    question_type: str
    conversation_id: int

class ChatbotResponse(BaseModel):
    reply: str
    conversation_id: int