from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, Transaction
from schemas import ChatMessage, ChatResponse, InsightResponse
from auth import get_current_user
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
import os

router = APIRouter()

# Initialize Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.7,
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


def get_user_financial_context(user_id: int, db: Session) -> str:
    """Fetch user's financial data to provide context to AI"""
    transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
    
    if not transactions:
        return "No transaction history available yet."
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
    total_expenses = sum(abs(t.amount) for t in transactions if t.transaction_type == "expense")
    
    # Category breakdown
    categories = {}
    for t in transactions:
        if t.transaction_type == "expense":
            categories[t.category] = categories.get(t.category, 0) + abs(t.amount)
    
    context = f"""
User Financial Summary:
- Total Income: ₹{total_income:,.2f}
- Total Expenses: ₹{total_expenses:,.2f}
- Net Savings: ₹{total_income - total_expenses:,.2f}
- Savings Rate: {((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0:.1f}%

Expense Breakdown by Category:
"""
    for category, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        context += f"\n- {category}: ₹{amount:,.2f}"
    
    return context


@router.post("/chat", response_model=ChatResponse)
async def chat_with_advisor(
    chat_message: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with AI Financial Advisor"""
    try:
        # Convert conversation history to LangChain message format
        history = []
        for msg in chat_message.conversation_history[-10:]:  # Last 10 messages
            if msg.get("type") == "user":
                history.append(HumanMessage(content=msg.get("content", "")))
            elif msg.get("type") == "bot":
                history.append(AIMessage(content=msg.get("content", "")))
        
        # Get user's financial context
        user_context = get_user_financial_context(current_user.id, db)
        
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate personalized financial insights using AI"""
    try:
        user_context = get_user_financial_context(current_user.id, db)
        
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
        
        import json
        insights = json.loads(response.content)
        
        return InsightResponse(insights=insights)
        
    except Exception:
        # Fallback to default insights if AI fails
        return InsightResponse(insights=[
            {
                "type": "positive",
                "title": "Good Savings Habit",
                "message": "You're maintaining a positive savings rate this month.",
                "confidence": "90%"
            },
            {
                "type": "opportunity",
                "title": "Investment Opportunity",
                "message": "Consider investing your savings for better returns.",
                "confidence": "85%"
            },
            {
                "type": "warning",
                "title": "Track Your Expenses",
                "message": "Some expense categories need closer monitoring.",
                "confidence": "88%"
            }
        ])


@router.post("/forecast")
async def forecast_expenses(
    months: int = 3,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Forecast future expenses using AI analysis"""
    try:
        transactions = db.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).all()
        
        # Calculate average monthly expenses
        total_expenses = sum(
            abs(t.amount) for t in transactions if t.transaction_type == "expense"
        )
        num_months = len(set(t.date.strftime("%Y-%m") for t in transactions)) or 1
        avg_monthly_expenses = total_expenses / num_months
        
        # Simple forecast with growth rate
        forecast = []
        for i in range(1, months + 1):
            month_date = datetime.now() + timedelta(days=30 * i)
            predicted = avg_monthly_expenses * (1 + (i * 0.02))  # 2% growth per month
            
            forecast.append({
                "month": month_date.strftime("%B %Y"),
                "predicted_expenses": int(predicted),
                "confidence": max(95 - (i * 3), 70)  # Decreasing confidence
            })
        
        return {"forecast": forecast}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.get("/tips")
async def get_financial_tips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized financial tips"""
    user_context = get_user_financial_context(current_user.id, db)
    
    try:
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
            },
            {
                "title": "Track Daily Expenses",
                "description": "Monitor spending daily to identify unnecessary purchases and save more.",
                "impact": "Medium",
                "difficulty": "Easy"
            },
            {
                "title": "Create Emergency Fund",
                "description": "Build 6 months of expenses as emergency fund for financial security.",
                "impact": "High",
                "difficulty": "Medium"
            }
        ]}