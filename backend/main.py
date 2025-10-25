from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from database import get_db
from models import User, Transaction
from schemas import UserCreate, UserLogin, TransactionCreate, TransactionResponse
from auth import get_current_user, verify_password, get_password_hash, create_access_token
from nlp_service import ExpenseCategorizer
from ai_service import router as ai_router

app = FastAPI(title="AI-Financial Advicer API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(ai_router)

# API Routes
@app.get("/")
async def root():
    return {"message": "AI-Financial Advicer API"}

@app.post("/auth/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User created successfully", "user_id": db_user.id}

@app.post("/auth/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer", "user_name" : db_user.full_name}

@app.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    return transactions

@app.post("/transactions", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    expennse_categorizer = ExpenseCategorizer()
    category = expennse_categorizer.categorize(transaction.description,transaction.amount)
    
    db_transaction = Transaction(
        user_id=current_user.id,
        description=transaction.description,
        amount=transaction.amount,
        category=category,
        transaction_type=transaction.transaction_type,
        date=transaction.date or datetime.utcnow(),
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/analytics/summary")
async def get_analytics_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
    total_expenses = sum(abs(t.amount) for t in transactions if t.transaction_type == "expense")
    net_savings = total_income - total_expenses
    
    # Category breakdown
    categories = {}
    for t in transactions:
        if t.transaction_type == "expense":
            categories[t.category] = categories.get(t.category, 0) + abs(t.amount)
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": net_savings,
        "savings_rate": (net_savings / total_income * 100) if total_income > 0 else 0,
        "category_breakdown": categories
    }

@app.post("/ai/forecast")
async def get_forecast(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Mock forecast using Facebook Prophet (simplified)
    # In production, this would use actual Prophet model
    transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
    
    # Calculate average monthly expenses
    total_expenses = sum(abs(t.amount) for t in transactions if t.transaction_type == "expense")
    avg_monthly_expenses = total_expenses / 6  # Assuming 6 months of data
    
    # Simple forecast (mock)
    forecast = []
    for i in range(1, 7):  # Next 6 months
        predicted_expenses = avg_monthly_expenses * (1 + (i * 0.02))  # 2% growth per month
        forecast.append({
            "month": f"Month +{i}",
            "predicted_expenses": predicted_expenses,
            "confidence": max(95 - (i * 3), 70)  # Decreasing confidence
        })
    
    return {"forecast": forecast}

@app.post("/ai/chat")
async def chat_with_ai(
    message: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock AI response (in production, integrate with OpenAI or similar)
    user_message = message.get("message", "")
    
    # Simple keyword-based responses
    if "budget" in user_message.lower():
        response = "Based on your spending patterns, I recommend setting a monthly budget of ₹3,50,000 for expenses. You're currently spending ₹3,45,000 on average."
    elif "save" in user_message.lower():
        response = "Great question! You're currently saving 58% of your income. To increase savings, consider reducing entertainment expenses by ₹5,000 monthly."
    elif "invest" in user_message.lower():
        response = "With your current savings rate, you could invest ₹2,00,000 monthly in SIP mutual funds. Consider a diversified portfolio with 60% equity and 40% debt."
    else:
        response = "I'm here to help with your financial questions! Ask me about budgeting, saving, investing, or expense analysis."
    
    return {"response": response}

# Simple NLP categorization function (mock)
def categorize_transaction(description: str) -> str:
    description_lower = description.lower()
    
    if any(word in description_lower for word in ["restaurant", "food", "cafe", "dining", "bazaar", "grocery"]):
        return "Food & Dining"
    elif any(word in description_lower for word in ["petrol", "gas", "uber", "taxi", "transport", "bus"]):
        return "Transportation"
    elif any(word in description_lower for word in ["amazon", "shopping", "mall", "store", "purchase"]):
        return "Shopping"
    elif any(word in description_lower for word in ["bill", "electricity", "water", "internet", "phone", "utility"]):
        return "Bills & Utilities"
    elif any(word in description_lower for word in ["movie", "netflix", "entertainment", "game", "music"]):
        return "Entertainment"
    elif any(word in description_lower for word in ["salary", "freelance", "income", "payment", "bonus"]):
        return "Income"
    else:
        return "Other"