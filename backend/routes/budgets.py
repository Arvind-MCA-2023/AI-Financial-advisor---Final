from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Budget, User, Transaction
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()


# Pydantic schemas
class BudgetCreate(BaseModel):
    category: str = Field(..., description="Budget category")
    monthly_limit: float = Field(..., gt=0, description="Monthly budget limit")
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    year: int = Field(..., ge=2020, description="Year")


class BudgetUpdate(BaseModel):
    monthly_limit: float | None = Field(None, gt=0)
    month: int | None = Field(None, ge=1, le=12)
    year: int | None = Field(None, ge=2020)


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    category: str
    monthly_limit: float
    current_spent: float
    remaining: float
    percentage_used: float
    month: int
    year: int
    status: str  # "under_budget", "near_limit", "over_budget"

    class Config:
        from_attributes = True


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new budget for a specific category and month"""
    
    # Check if budget already exists for this category/month/year
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget.category,
        Budget.month == budget.month,
        Budget.year == budget.year
    ).first()
    
    if existing_budget:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Budget already exists for {budget.category} in {budget.month}/{budget.year}"
        )
    
    # Calculate current spent for this category/month
    current_spent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == budget.category,
        Transaction.transaction_type == "expense",
        db.extract('month', Transaction.date) == budget.month,
        db.extract('year', Transaction.date) == budget.year
    ).with_entities(db.func.sum(Transaction.amount)).scalar() or 0.0
    
    # Create budget
    new_budget = Budget(
        user_id=current_user.id,
        category=budget.category,
        monthly_limit=budget.monthly_limit,
        current_spent=current_spent,
        month=budget.month,
        year=budget.year
    )
    
    db.add(new_budget)
    db.commit()
    db.refresh(new_budget)
    
    return _format_budget_response(new_budget)


@router.get("", response_model=List[BudgetResponse])
def get_budgets(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all budgets for the current user, optionally filtered by month/year"""
    
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if month:
        query = query.filter(Budget.month == month)
    if year:
        query = query.filter(Budget.year == year)
    
    budgets = query.all()
    
    # Update current_spent for each budget
    for budget in budgets:
        current_spent = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == budget.category,
            Transaction.transaction_type == "expense",
            db.extract('month', Transaction.date) == budget.month,
            db.extract('year', Transaction.date) == budget.year
        ).with_entities(db.func.sum(Transaction.amount)).scalar() or 0.0
        
        budget.current_spent = current_spent
    
    db.commit()
    
    return [_format_budget_response(b) for b in budgets]


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific budget by ID"""
    
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Update current_spent
    current_spent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == budget.category,
        Transaction.transaction_type == "expense",
        db.extract('month', Transaction.date) == budget.month,
        db.extract('year', Transaction.date) == budget.year
    ).with_entities(db.func.sum(Transaction.amount)).scalar() or 0.0
    
    budget.current_spent = current_spent
    db.commit()
    
    return _format_budget_response(budget)


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a budget"""
    
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    # Update fields
    if budget_update.monthly_limit is not None:
        budget.monthly_limit = budget_update.monthly_limit
    if budget_update.month is not None:
        budget.month = budget_update.month
    if budget_update.year is not None:
        budget.year = budget_update.year
    
    # Recalculate current_spent if month/year changed
    current_spent = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == budget.category,
        Transaction.transaction_type == "expense",
        db.extract('month', Transaction.date) == budget.month,
        db.extract('year', Transaction.date) == budget.year
    ).with_entities(db.func.sum(Transaction.amount)).scalar() or 0.0
    
    budget.current_spent = current_spent
    
    db.commit()
    db.refresh(budget)
    
    return _format_budget_response(budget)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a budget"""
    
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    db.delete(budget)
    db.commit()
    
    return None


def _format_budget_response(budget: Budget) -> dict:
    """Helper function to format budget response with calculated fields"""
    remaining = budget.monthly_limit - budget.current_spent
    percentage_used = (budget.current_spent / budget.monthly_limit * 100) if budget.monthly_limit > 0 else 0
    
    # Determine status
    if percentage_used >= 100:
        status = "over_budget"
    elif percentage_used >= 80:
        status = "near_limit"
    else:
        status = "under_budget"
    
    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "category": budget.category,
        "monthly_limit": budget.monthly_limit,
        "current_spent": budget.current_spent,
        "remaining": remaining,
        "percentage_used": round(percentage_used, 2),
        "month": budget.month,
        "year": budget.year,
        "status": status
    }