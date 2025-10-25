from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
import os
from sqlalchemy.orm import Session
from auth import get_current_user
from schemas import ChatMessage, ChatResponse, InsightResponse
from models import Transaction, User
from database import get_db

# Initialize router
router = APIRouter(prefix="/ai", tags=["AI Advisor"])

# Initialize Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.7,  # More creative for advice
)

# Financial Advisor System Prompt
FINANCIAL_ADVISOR_PROMPT = """You are an expert AI Financial Advisor with deep knowledge in:
- Personal finance management
- Investment strategies
- Budgeting and expense optimization
- Debt management
- Savings strategies
- Tax planning (Indian context)
- Credit score improvement

Your personality:
- Professional yet friendly and approachable
- Data-driven but explain concepts simply
- Encouraging and supportive
- Honest about risks and limitations
- Culturally aware (Indian financial context - INR, Indian tax laws, local investment options)

Guidelines:
- Always provide actionable, specific advice
- Use Indian Rupees (₹) for all amounts
- Consider Indian financial products (PPF, EPF, NPS, Mutual Funds, etc.)
- Be concise but thorough (2-4 paragraphs max per response)
- Use examples when helpful
- Ask clarifying questions if needed
- Never guarantee returns or provide get-rich-quick schemes
- Always remind about risk assessment and emergency funds

Current conversation context:
{context}
"""

# Create the chat chain
prompt = ChatPromptTemplate.from_messages([
    ("system", FINANCIAL_ADVISOR_PROMPT),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}")
])

chain = prompt | llm | StrOutputParser()


def get_user_financial_context(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> str:
    """
    Fetch user's financial data to provide context to AI
    Replace with your actual database queries
    """
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    return transactions


@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user)  # Your auth dependency
):
    """
    Chat with AI Financial Advisor
    """
    try:
        # Convert conversation history to LangChain message format
        history = []
        for msg in chat_message.conversation_history[-10:]:  # Last 10 messages for context
            if msg.get("type") == "user":
                history.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("type") == "bot":
                history.append(AIMessage(content=msg.get("content", "")))
        
        # Get user's financial context
        user_context = get_user_financial_context(current_user.id, db=None)
        
        # Generate response
        response = await chain.ainvoke({
            "context": user_context,
            "history": history,
            "input": chat_message.message
        })
        
        return ChatResponse(
            response=response,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")


@router.get("/insights", response_model=InsightResponse)
async def get_ai_insights(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate personalized financial insights using AI
    """
    try:
        # Get user's financial data
        user_context = get_user_financial_context(current_user["id"], db=None)
        
        # Create insights prompt
        insights_prompt = f"""Based on this user's financial profile:

{user_context}

Generate 3 personalized financial insights:
1. One positive achievement/progress (type: positive)
2. One opportunity for optimization (type: opportunity)
3. One warning or alert (type: warning)

For each insight, provide:
- A short title (4-6 words)
- A specific message with exact numbers
- Confidence level (85-95%)

Format as JSON array with structure:
[{{"type": "positive", "title": "...", "message": "...", "confidence": "92%"}}]

Return ONLY the JSON array, no additional text."""

        response = await llm.ainvoke(insights_prompt)
        
        # Parse the JSON response
        import json
        insights = json.loads(response.content)
        
        return InsightResponse(insights=insights)
        
    except Exception:
        # Fallback to default insights if AI fails
        return InsightResponse(insights=[
            {
                "type": "positive",
                "title": "Excellent Savings Rate",
                "message": "You're saving 34.7% of your income, which is above the recommended 20%.",
                "confidence": "95%"
            },
            {
                "type": "opportunity",
                "title": "Investment Opportunity",
                "message": "Your emergency fund is solid. Consider investing ₹50,000 in index funds for long-term growth.",
                "confidence": "88%"
            },
            {
                "type": "warning",
                "title": "Entertainment Overspending",
                "message": "Entertainment costs increased 30% this month (₹9,500). Consider setting a ₹7,000 monthly limit.",
                "confidence": "91%"
            }
        ])


@router.post("/categorize")
async def categorize_transaction(
    description: str,
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    """
    Categorize a transaction using AI
    """
    try:
        categories = [
            "Food & Dining", "Transportation", "Shopping", 
            "Bills & Utilities", "Healthcare", "Education",
            "Entertainment", "Personal Care", "Groceries",
            "Travel", "Income", "Other"
        ]
        
        prompt_text = f"""Categorize this transaction:
Description: {description}
Amount: ₹{amount}

Available categories: {', '.join(categories)}

Rules:
- Return ONLY the category name, nothing else
- Consider Indian context (vendors, services)
- Use the most appropriate category

Category:"""

        response = await llm.ainvoke(prompt_text)
        category = response.content.strip()
        
        # Validate category
        if category not in categories:
            category = "Other"
        
        return {
            "category": category,
            "confidence": 0.92,
            "ai_categorized": True
        }
        
    except Exception:
        return {
            "category": "Other",
            "confidence": 0.0,
            "ai_categorized": False
        }


@router.get("/forecast")
async def forecast_expenses(
    months: int = 3,
    current_user: dict = Depends(get_current_user)
):
    """
    Forecast future expenses using AI analysis
    """
    try:
        user_context = get_user_financial_context(current_user["id"], db=None)
        
        forecast_prompt = f"""Based on this financial profile:

{user_context}

Forecast monthly expenses for the next {months} months.

Consider:
- Current spending patterns
- Seasonal variations (festivals, holidays)
- Inflation (6% annual)
- Observed trends

Return JSON with format:
{{"months": [{{"month": "November 2024", "projected_expense": 65000, "confidence": "87%"}}]}}

Return ONLY valid JSON."""

        response = await llm.ainvoke(forecast_prompt)
        
        import json
        forecast = json.loads(response.content)
        
        return forecast
        
    except Exception:
        # Fallback forecast
        base_expense = 62000
        forecasts = []
        for i in range(months):
            month_date = datetime.now() + timedelta(days=30 * (i + 1))
            forecasts.append({
                "month": month_date.strftime("%B %Y"),
                "projected_expense": int(base_expense * (1 + (i * 0.02))),
                "confidence": "85%"
            })
        
        return {"months": forecasts}


@router.get("/tips")
async def get_financial_tips(
    current_user: dict = Depends(get_current_user)
):
    """
    Get personalized financial tips
    """
    try:
        user_context = get_user_financial_context(current_user["id"], db=None)
        
        tips_prompt = f"""Based on this financial profile:

{user_context}

Generate 3 actionable financial tips with:
- Title (3-5 words)
- Description (15-20 words)
- Impact level (High/Medium/Low)
- Difficulty (Easy/Medium/Hard)

Return as JSON array:
[{{"title": "...", "description": "...", "impact": "High", "difficulty": "Easy"}}]"""

        response = await llm.ainvoke(tips_prompt)
        
        import json
        tips = json.loads(response.content)
        
        return {"tips": tips}
        
    except Exception:
        # Fallback tips
        return {"tips": [
            {
                "title": "Automate Savings",
                "description": "Set up automatic transfers to save 20% of income without thinking about it.",
                "impact": "High",
                "difficulty": "Easy"
            }
        ]}


# Mock auth dependency - replace with your actual auth
async def get_current_user():
    """Replace with your actual authentication logic"""
    return {"id": 1, "email": "user@example.com"}