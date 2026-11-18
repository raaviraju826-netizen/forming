"""
KisanAI RAG Chatbot Engine
Retrieval-Augmented Generation with multilingual support.
Uses FAISS for vector retrieval and OpenAI/Gemini for LLM responses.
"""
import os
import json
import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any
from loguru import logger

from app.core.config import settings

# Lazy globals
_embedder = None
_faiss_index = None
_knowledge_chunks: List[Dict] = []
_llm_client = None
_rag_initialized = False


SYSTEM_PROMPT_EN = """You are KisanAI, an intelligent farming assistant for Indian farmers.
You provide evidence-based agricultural advice about crop diseases, treatments, farming practices,
weather-based guidance, and market information.

IMPORTANT RULES:
- Only recommend agricultural treatments verified in Indian agricultural guidelines.
- Never fabricate pesticide names, dosages, or scientific facts.
- If unsure, say so clearly and recommend consulting a local agricultural officer or KVK.
- For serious disease outbreaks, always recommend expert consultation.
- Be compassionate, clear, and practical in your responses.
- Use simple language suitable for farmers."""

SYSTEM_PROMPT_HI = """आप KisanAI हैं, भारतीय किसानों के लिए एक बुद्धिमान कृषि सहायक।
आप फसल रोगों, उपचार, कृषि प्रथाओं और बाजार जानकारी के बारे में साक्ष्य-आधारित सलाह देते हैं।

महत्वपूर्ण नियम:
- केवल भारतीय कृषि दिशानिर्देशों में सत्यापित उपचार की सिफारिश करें।
- कभी भी कीटनाशक नाम, खुराक या वैज्ञानिक तथ्य नहीं बनाएं।
- अनिश्चित होने पर, स्थानीय कृषि अधिकारी या KVK से परामर्श की सिफारिश करें।
- सरल और व्यावहारिक भाषा में उत्तर दें।"""

SYSTEM_PROMPT_TE = """మీరు KisanAI, భారతీయ రైతులకు తెలివైన వ్యవసాయ సహాయకుడు.
మీరు పంట వ్యాధులు, చికిత్సలు, వ్యవసాయ పద్ధతులు మరియు మార్కెట్ సమాచారం గురించి సాక్ష్య-ఆధారిత సలహా ఇస్తారు.

ముఖ్యమైన నియమాలు:
- భారతీయ వ్యవసాయ మార్గదర్శకాలలో ధృవీకరించిన చికిత్సలను మాత్రమే సిఫారసు చేయండి।
- పురుగుమందుల పేర్లు, మోతాదులు లేదా వైజ్ఞానిక వాస్తవాలను ఎప్పుడూ కల్పించవద్దు।
- అనిశ్చితంగా ఉంటే, స్థానిక వ్యవసాయ అధికారి లేదా KVK ని సంప్రదించండి।
- రైతులకు అనుకూలమైన సరళమైన భాషలో సమాధానం ఇవ్వండి।"""

SYSTEM_PROMPTS = {"en": SYSTEM_PROMPT_EN, "hi": SYSTEM_PROMPT_HI, "te": SYSTEM_PROMPT_TE}


def _build_fallback_knowledge() -> List[Dict]:
    """Built-in agricultural knowledge for when no external KB is loaded."""
    return [
        {"text": "Early blight (Alternaria solani) in tomato causes dark brown concentric spots on leaves. Management includes crop rotation, removing infected plant material, maintaining adequate plant spacing, and application of approved fungicides per label instructions.", "source": "Agricultural Knowledge Base"},
        {"text": "Late blight (Phytophthora infestans) causes water-soaked lesions on tomato and potato. It spreads rapidly in cool wet weather. Remove infected plants, improve drainage, and consult local agricultural department for approved fungicide options.", "source": "Agricultural Knowledge Base"},
        {"text": "Powdery mildew appears as white powdery growth on leaves. Improve air circulation, avoid overhead irrigation, and use sulfur-based fungicides per label for approved crops.", "source": "Agricultural Knowledge Base"},
        {"text": "Yellow mosaic virus in soybean and other crops is spread by whiteflies. Control whitefly populations to reduce spread. Remove infected plants.", "source": "Agricultural Knowledge Base"},
        {"text": "Integrated Pest Management (IPM) combines cultural, biological, and when necessary chemical methods to manage pests sustainably. It aims to minimize pesticide use.", "source": "Agricultural Knowledge Base"},
        {"text": "Drip irrigation reduces water usage by 30-50% compared to flood irrigation. It delivers water directly to the root zone and reduces foliar disease incidence.", "source": "Agricultural Knowledge Base"},
        {"text": "Soil health can be improved through addition of organic matter like compost or farmyard manure, which improves water retention and microbial activity.", "source": "Agricultural Knowledge Base"},
        {"text": "Krishi Vigyan Kendras (KVKs) are agricultural research and extension centers in India. Farmers can visit their local KVK for soil testing, disease diagnosis, and crop management guidance.", "source": "Agricultural Knowledge Base"},
        {"text": "Nitrogen deficiency shows as yellowing of older leaves starting from the bottom. Phosphorus deficiency causes purple coloration. Potassium deficiency causes leaf margin scorch.", "source": "Agricultural Knowledge Base"},
        {"text": "Crop rotation helps break pest and disease cycles. Avoid planting the same crop family in the same field for consecutive seasons.", "source": "Agricultural Knowledge Base"},
    ]


async def initialize_rag():
    """Initialize the RAG system with FAISS and sentence transformers."""
    global _embedder, _faiss_index, _knowledge_chunks, _llm_client, _rag_initialized

    if _rag_initialized:
        return

    try:
        from sentence_transformers import SentenceTransformer
        import faiss
        import numpy as np

        logger.info("Initializing RAG chatbot...")

        # Load embedder
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")

        # Load knowledge base
        kb_path = Path("./app/data/knowledge_base")
        chunks = []

        if kb_path.exists():
            for doc_file in kb_path.glob("*.json"):
                with open(doc_file) as f:
                    doc_data = json.load(f)
                    chunks.extend(doc_data.get("chunks", []))

        if not chunks:
            chunks = _build_fallback_knowledge()
            logger.info(f"Using built-in knowledge base with {len(chunks)} entries.")
        else:
            logger.info(f"Loaded {len(chunks)} knowledge chunks from files.")

        _knowledge_chunks = chunks

        # Build FAISS index
        texts = [c["text"] for c in chunks]
        embeddings = _embedder.encode(texts, normalize_embeddings=True)
        dimension = embeddings.shape[1]

        index = faiss.IndexFlatIP(dimension)  # Inner product = cosine similarity on normalized vecs
        index.add(embeddings.astype("float32"))
        _faiss_index = index

        # Initialize LLM client
        if settings.OPENAI_API_KEY:
            from openai import AsyncOpenAI
            _llm_client = ("openai", AsyncOpenAI(api_key=settings.OPENAI_API_KEY))
        elif settings.GEMINI_API_KEY:
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            _llm_client = ("gemini", genai.GenerativeModel("gemini-1.5-flash"))

        _rag_initialized = True
        logger.info("RAG chatbot initialized successfully.")

    except Exception as e:
        logger.warning(f"RAG initialization partial failure: {e}. Will use fallback mode.")
        _knowledge_chunks = _build_fallback_knowledge()
        _rag_initialized = True


def retrieve_context(query: str, top_k: int = 3) -> tuple[str, List[str]]:
    """Retrieve relevant knowledge chunks for a query."""
    if not _faiss_index or not _embedder or not _knowledge_chunks:
        # Fallback: simple keyword search
        query_lower = query.lower()
        relevant = [c for c in _knowledge_chunks if any(w in c["text"].lower() for w in query_lower.split() if len(w) > 3)]
        if relevant:
            context = "\n\n".join(r["text"] for r in relevant[:3])
            sources = list(set(r.get("source", "Agricultural Knowledge Base") for r in relevant[:3]))
        else:
            context = ""
            sources = []
        return context, sources

    try:
        import numpy as np
        query_embedding = _embedder.encode([query], normalize_embeddings=True).astype("float32")
        distances, indices = _faiss_index.search(query_embedding, top_k)

        retrieved = []
        sources = []
        for idx, score in zip(indices[0], distances[0]):
            if idx < len(_knowledge_chunks) and score > 0.3:
                retrieved.append(_knowledge_chunks[idx]["text"])
                sources.append(_knowledge_chunks[idx].get("source", "Agricultural Knowledge Base"))

        context = "\n\n".join(retrieved)
        return context, list(set(sources))
    except Exception as e:
        logger.error(f"Retrieval error: {e}")
        return "", []


async def get_llm_response(messages: List[Dict], language: str) -> str:
    """Get response from configured LLM."""
    if not _llm_client:
        return _get_fallback_response(language)

    client_type, client = _llm_client

    try:
        if client_type == "openai":
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=800,
                temperature=0.3,
            )
            return response.choices[0].message.content

        elif client_type == "gemini":
            # Convert messages to Gemini format
            system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
            user_messages = [m for m in messages if m["role"] != "system"]
            combined = system_msg + "\n\n" + "\n".join(
                f"{m['role'].upper()}: {m['content']}" for m in user_messages
            )
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: client.generate_content(combined)
            )
            return response.text

    except Exception as e:
        logger.error(f"LLM error: {e}")
        return _get_fallback_response(language)


def _get_fallback_response(language: str) -> str:
    fallbacks = {
        "en": "I'm here to help with your farming questions. For specific disease diagnosis or treatment recommendations, please consult your local Krishi Vigyan Kendra (KVK) or agricultural extension officer. You can also upload a leaf photo for AI-based disease detection.",
        "hi": "मैं आपके कृषि प्रश्नों में सहायता के लिए यहाँ हूँ। विशिष्ट रोग निदान या उपचार सिफारिशों के लिए, कृपया अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि विस्तार अधिकारी से परामर्श करें।",
        "te": "మీ వ్యవసాయ ప్రశ్నలలో సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. నిర్దిష్ట వ్యాధి నిర్ధారణ లేదా చికిత్స సిఫారసుల కోసం, మీ స్థానిక కృషి విజ్ఞాన కేంద్రం (KVK) లేదా వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి.",
    }
    return fallbacks.get(language, fallbacks["en"])


async def get_rag_response(
    message: str,
    language: str = "en",
    conversation_history: Optional[List[Dict]] = None,
    scan_context: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Main RAG response function."""
    await initialize_rag()

    # Retrieve relevant context
    context, sources = retrieve_context(message)

    # Build prompt
    system_prompt = SYSTEM_PROMPTS.get(language, SYSTEM_PROMPT_EN)

    scan_note = ""
    if scan_context:
        scan_note = (
            f"\n\nCURRENT SCAN CONTEXT: The farmer recently scanned a "
            f"{scan_context.get('crop_name', 'crop')} leaf. "
            f"The AI model predicted: {scan_context.get('predicted_disease', 'unknown disease')} "
            f"with {scan_context.get('confidence', 0):.0%} confidence. "
            f"Use this context when answering follow-up questions."
        )

    if context:
        system_prompt += f"\n\nRELEVANT AGRICULTURAL KNOWLEDGE:\n{context}{scan_note}"
    elif scan_note:
        system_prompt += scan_note

    messages = [{"role": "system", "content": system_prompt}]

    if conversation_history:
        messages.extend(conversation_history[-8:])

    messages.append({"role": "user", "content": message})

    response_text = await get_llm_response(messages, language)

    disclaimer = None
    if any(word in message.lower() for word in ["pesticide", "medicine", "spray", "dosage", "chemical"]):
        disclaimer = (
            "Always follow official product labels and consult a qualified agricultural officer "
            "before applying any pesticide or chemical treatment."
        )

    return {
        "response": response_text,
        "sources": sources,
        "context_used": context[:500] if context else None,
        "disclaimer": disclaimer,
    }
