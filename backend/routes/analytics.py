from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User, Transaction
from auth import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get financial analytics summary"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()
    
    total_income = sum(
        t.amount for t in transactions if t.transaction_type == "income"
    )
    total_expenses = sum(
        abs(t.amount) for t in transactions if t.transaction_type == "expense"
    )
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


@router.get("/monthly")
async def get_monthly_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly analytics"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()
    
    # Group by month
    monthly_data = {}
    for t in transactions:
        month_key = t.date.strftime("%Y-%m")
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "income": 0,
                "expenses": 0
            }
        
        if t.transaction_type == "income":
            monthly_data[month_key]["income"] += t.amount
        else:
            monthly_data[month_key]["expenses"] += abs(t.amount)
    
    # Calculate savings per month
    result = []
    for month, data in sorted(monthly_data.items()):
        result.append({
            "month": month,
            "income": data["income"],
            "expenses": data["expenses"],
            "savings": data["income"] - data["expenses"]
        })
    
    return result