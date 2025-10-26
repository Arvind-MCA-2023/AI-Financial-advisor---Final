from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from models import User, Transaction
from schemas import ChatMessage, ChatResponse, InsightResponse, ForecastRequest
from auth import get_current_user
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
import os
import pandas as pd
import numpy as np
from typing import Optional, List, Dict
import json

router = APIRouter()

# Initialize Groq LLM
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama-3.1-8b-instant",
    temperature=0.7,
)

# Try to import Prophet (optional dependency)
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("⚠️  Prophet not installed. Using statistical fallback for forecasting.")
    print("   Install with: pip install prophet")


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


def prepare_timeseries_data(transactions: List[Transaction], transaction_type: str = "expense") -> pd.DataFrame:
    """Convert transactions to Prophet-compatible format"""
    if not transactions:
        return pd.DataFrame(columns=['ds', 'y'])
    
    # Filter by type
    filtered = [t for t in transactions if t.transaction_type == transaction_type]
    
    if not filtered:
        return pd.DataFrame(columns=['ds', 'y'])
    
    # Group by date
    data = {}
    for t in filtered:
        date_key = t.date.strftime('%Y-%m-%d')
        data[date_key] = data.get(date_key, 0) + abs(t.amount)
    
    # Create DataFrame
    df = pd.DataFrame([
        {'ds': pd.to_datetime(date), 'y': amount}
        for date, amount in data.items()
    ])
    
    df = df.sort_values('ds').reset_index(drop=True)
    return df


def forecast_with_prophet(df: pd.DataFrame, periods: int = 90) -> Dict:
    """Use Prophet for time-series forecasting"""
    if len(df) < 10:  # Need minimum data points
        return None
    
    try:
        # Initialize and train Prophet model
        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,  # Flexibility in trend changes
            seasonality_prior_scale=10.0,   # Strength of seasonality
        )
        
        model.fit(df)
        
        # Create future dates
        future = model.make_future_dataframe(periods=periods)
        forecast = model.predict(future)
        
        # Extract predictions
        predictions = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)
        
        return {
            'model': model,
            'forecast': forecast,
            'predictions': predictions
        }
    except Exception as e:
        print(f"Prophet forecasting error: {e}")
        return None


def statistical_forecast_fallback(df: pd.DataFrame, periods: int = 90) -> List[Dict]:
    """Simple statistical forecast when Prophet unavailable or insufficient data"""
    if len(df) == 0:
        return []
    
    # Calculate moving average and trend
    recent_avg = df['y'].tail(30).mean() if len(df) >= 30 else df['y'].mean()
    overall_avg = df['y'].mean()
    
    # Simple linear trend
    if len(df) >= 7:
        recent_trend = (df['y'].tail(7).mean() - df['y'].head(7).mean()) / len(df)
    else:
        recent_trend = 0
    
    # Generate predictions
    predictions = []
    last_date = df['ds'].max()
    
    for i in range(1, periods + 1):
        pred_date = last_date + timedelta(days=i)
        predicted_value = recent_avg + (recent_trend * i)
        
        # Add some uncertainty bounds (±15%)
        predictions.append({
            'ds': pred_date,
            'yhat': max(0, predicted_value),
            'yhat_lower': max(0, predicted_value * 0.85),
            'yhat_upper': predicted_value * 1.15,
            'confidence': max(70, 95 - i)  # Decreasing confidence
        })
    
    return predictions


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
        
        try:
            insights = json.loads(response.content)
        except:
            # Extract JSON from response if wrapped in text
            content = response.content
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                insights = json.loads(content[start:end])
            else:
                raise ValueError("Could not parse JSON")
        
        return InsightResponse(insights=insights)
        
    except Exception as e:
        print(f"Insights generation error: {e}")
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
    months: int = Query(3, ge=1, le=12, description="Number of months to forecast"),
    category: Optional[str] = Query(None, description="Specific category to forecast"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Forecast future expenses using Prophet (if available) or statistical methods
    
    Returns monthly predictions with confidence intervals
    """
    try:
        # Fetch user transactions
        query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
        
        if category:
            query = query.filter(Transaction.category == category)
        
        transactions = query.all()
        
        if not transactions:
            return {
                "forecast": [],
                "method": "none",
                "message": "No transaction history available for forecasting"
            }
        
        # Prepare data
        df = prepare_timeseries_data(transactions, "expense")
        
        if len(df) < 3:
            return {
                "forecast": [],
                "method": "insufficient_data",
                "message": "Need at least 3 days of data for forecasting"
            }
        
        # Try Prophet first if available
        forecast_method = "statistical"
        predictions = []
        
        if PROPHET_AVAILABLE:
            prophet_result = forecast_with_prophet(df, periods=months * 30)
            if prophet_result:
                forecast_method = "prophet"
                # Convert Prophet predictions to monthly aggregates
                pred_df = prophet_result['predictions']
                pred_df['month'] = pred_df['ds'].dt.to_period('M')
                
                monthly_forecast = []
                for month, group in pred_df.groupby('month'):
                    monthly_sum = group['yhat'].sum()
                    monthly_lower = group['yhat_lower'].sum()
                    monthly_upper = group['yhat_upper'].sum()
                    
                    # Calculate confidence based on interval width
                    interval_width = (monthly_upper - monthly_lower) / monthly_sum
                    confidence = max(70, min(95, int(100 - interval_width * 100)))
                    
                    monthly_forecast.append({
                        "month": month.strftime("%B %Y"),
                        "predicted_expenses": int(monthly_sum),
                        "lower_bound": int(monthly_lower),
                        "upper_bound": int(monthly_upper),
                        "confidence": confidence
                    })
                
                predictions = monthly_forecast[:months]
        
        # Fallback to statistical method
        if not predictions:
            daily_predictions = statistical_forecast_fallback(df, periods=months * 30)
            
            if daily_predictions:
                # Aggregate to monthly
                pred_df = pd.DataFrame(daily_predictions)
                pred_df['month'] = pred_df['ds'].dt.to_period('M')
                
                monthly_forecast = []
                for month, group in pred_df.groupby('month'):
                    monthly_forecast.append({
                        "month": month.strftime("%B %Y"),
                        "predicted_expenses": int(group['yhat'].sum()),
                        "lower_bound": int(group['yhat_lower'].sum()),
                        "upper_bound": int(group['yhat_upper'].sum()),
                        "confidence": int(group['confidence'].mean())
                    })
                
                predictions = monthly_forecast[:months]
        
        # Calculate trend and insights
        if len(predictions) >= 2:
            first_month = predictions[0]['predicted_expenses']
            last_month = predictions[-1]['predicted_expenses']
            trend_change = ((last_month - first_month) / first_month * 100) if first_month > 0 else 0
        else:
            trend_change = 0
        
        return {
            "forecast": predictions,
            "method": forecast_method,
            "model_info": {
                "algorithm": "Facebook Prophet" if forecast_method == "prophet" else "Statistical Moving Average",
                "data_points": len(df),
                "training_period": f"{df['ds'].min().strftime('%Y-%m-%d')} to {df['ds'].max().strftime('%Y-%m-%d')}"
            },
            "trend_analysis": {
                "direction": "increasing" if trend_change > 5 else "decreasing" if trend_change < -5 else "stable",
                "change_percentage": round(trend_change, 2),
                "message": f"Expected {'increase' if trend_change > 0 else 'decrease'} of {abs(trend_change):.1f}% over forecast period"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


@router.get("/tips")
async def get_financial_tips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized financial tips using AI"""
    user_context = get_user_financial_context(current_user.id, db)
    
    try:
        tips_prompt = f"""Based on this financial profile:

{user_context}

Generate 3 actionable financial tips with:
- Title (3-5 words)
- Description (15-25 words with specific numbers when possible)
- Impact level (High/Medium/Low)
- Difficulty (Easy/Medium/Hard)

Return as JSON array:
[{{"title": "...", "description": "...", "impact": "High", "difficulty": "Easy"}}]

Return ONLY the JSON array."""

        response = await llm.ainvoke(tips_prompt)
        
        try:
            tips = json.loads(response.content)
        except:
            # Extract JSON from response
            content = response.content
            start = content.find('[')
            end = content.rfind(']') + 1
            if start >= 0 and end > start:
                tips = json.loads(content[start:end])
            else:
                raise ValueError("Could not parse JSON")
        
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


@router.get("/category-forecast")
async def forecast_by_category(
    months: int = Query(3, ge=1, le=6),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Forecast expenses broken down by category"""
    try:
        transactions = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == "expense"
        ).all()
        
        if not transactions:
            return {"category_forecasts": [], "message": "No expense data available"}
        
        # Group by category
        categories = {}
        for t in transactions:
            if t.category not in categories:
                categories[t.category] = []
            categories[t.category].append(t)
        
        # Forecast each category
        category_forecasts = []
        
        for category, cat_transactions in categories.items():
            df = prepare_timeseries_data(cat_transactions, "expense")
            
            if len(df) < 3:
                continue
            
            # Get current month average
            current_avg = df['y'].tail(30).mean() if len(df) >= 30 else df['y'].mean()
            
            # Simple trend calculation
            if len(df) >= 14:
                recent_avg = df['y'].tail(7).mean()
                older_avg = df['y'].tail(14).head(7).mean()
                trend = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0
            else:
                trend = 0
            
            # Predict next month
            next_month_pred = current_avg * (1 + trend / 100)
            
            category_forecasts.append({
                "category": category,
                "current_monthly_avg": int(current_avg),
                "predicted_next_month": int(next_month_pred),
                "trend_percentage": round(trend, 1),
                "confidence": 85 if len(df) >= 30 else 75
            })
        
        # Sort by amount
        category_forecasts.sort(key=lambda x: x['predicted_next_month'], reverse=True)
        
        return {
            "category_forecasts": category_forecasts,
            "total_predicted": sum(c['predicted_next_month'] for c in category_forecasts),
            "forecast_period": "next_month"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Category forecast failed: {str(e)}")