from pydantic import BaseModel

class ChatwootMessage(BaseModel):
    content: str
    question_type: str
    conversation_id: int

class ChatbotResponse(BaseModel):
    reply: str
    conversation_id: int