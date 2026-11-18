"""
KisanAI Multilingual AI Chatbot API
RAG-based chatbot with Telugu, Hindi, and English support.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.models import ChatConversation, ChatMessage, DiseaseScan
from app.schemas.schemas import ChatRequest, ChatResponse
from app.rag.chatbot import get_rag_response

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """
    Send a message to the KisanAI farming assistant.
    Supports Telugu (te), Hindi (hi), and English (en).
    Uses RAG to retrieve relevant agricultural knowledge.
    """
    session_id = request.session_id or str(uuid.uuid4())
    # IDs are plain strings now (SQLite-compatible)
    farmer_id = current_user["sub"] if current_user else None

    # Get or create conversation
    conversation = None
    if request.conversation_id:
        result = await db.execute(
            select(ChatConversation)
            .options(selectinload(ChatConversation.messages))
            .where(ChatConversation.id == request.conversation_id)
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        conversation = ChatConversation(
            session_id=session_id,
            farmer_id=farmer_id,
            language=request.language,
            scan_context_id=request.scan_context_id or None,
        )
        db.add(conversation)
        await db.flush()
        await db.commit()
        messages = []
    else:
        # Explicitly load messages in a separate async query (avoids greenlet issue)
        msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.conversation_id == conversation.id)
            .order_by(ChatMessage.created_at)
        )
        messages = msg_result.scalars().all()

    # Build conversation history
    history = [
        {"role": m.role, "content": m.content}
        for m in messages[-10:]
    ]

    # Get scan context if available
    scan_context = None
    if conversation.scan_context_id:
        result = await db.execute(
            select(DiseaseScan).where(DiseaseScan.id == conversation.scan_context_id)
        )
        scan = result.scalar_one_or_none()
        if scan:
            scan_context = {
                "crop_name": scan.crop_name,
                "predicted_disease": scan.predicted_class,
                "confidence": scan.confidence_score,
            }

    # Get RAG response
    try:
        rag_result = await get_rag_response(
            message=request.message,
            language=request.language,
            conversation_history=history,
            scan_context=scan_context,
        )
    except Exception as e:
        rag_result = {
            "response": "I'm here to help with your farming questions. Please consult your local Krishi Vigyan Kendra (KVK) for specific crop disease diagnosis.",
            "sources": [],
            "context_used": None,
            "disclaimer": None,
        }

    # Save messages to DB
    user_msg = ChatMessage(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        language=request.language,
    )
    assistant_msg = ChatMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=rag_result["response"],
        language=request.language,
        retrieved_context=rag_result.get("context_used"),
    )
    db.add(user_msg)
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        response=rag_result["response"],
        language=request.language,
        conversation_id=str(conversation.id),
        session_id=session_id,
        sources=rag_result.get("sources", []),
        disclaimer=rag_result.get("disclaimer"),
    )


@router.get("/history/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get message history for a conversation."""
    result = await db.execute(
        select(ChatConversation)
        .where(ChatConversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at)
    )
    msgs = msg_result.scalars().all()


    return {
        "conversation_id": str(conversation.id),
        "language": conversation.language,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
            }
            for m in msgs
        ],
        "created_at": conversation.created_at,
    }

