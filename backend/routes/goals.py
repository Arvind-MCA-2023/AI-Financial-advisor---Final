from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from database import get_db
from models import Goal, User
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter()


# Pydantic schemas
class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(default=0, ge=0)
    target_date: date


class GoalUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    target_amount: float | None = Field(None, gt=0)
    current_amount: float | None = Field(None, ge=0)
    target_date: date | None = None
    is_completed: bool | None = None


class GoalContribution(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to add to goal")


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str | None
    target_amount: float
    current_amount: float
    remaining_amount: float
    progress_percentage: float
    target_date: date
    days_remaining: int
    is_completed: bool
    status: str  # "on_track", "behind", "completed", "overdue"
    monthly_savings_needed: float

    class Config:
        from_attributes = True


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    goal: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new financial goal"""
    
    # Validate target date is in the future
    if goal.target_date <= date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target date must be in the future"
        )
    
    # Validate current amount doesn't exceed target
    if goal.current_amount > goal.target_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current amount cannot exceed target amount"
        )
    
    new_goal = Goal(
        user_id=current_user.id,
        name=goal.name,
        description=goal.description,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        target_date=goal.target_date,
        is_completed=False
    )
    
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    
    return _format_goal_response(new_goal)


@router.get("", response_model=List[GoalResponse])
def get_goals(
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all goals for the current user"""
    
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    
    if not include_completed:
        query = query.filter(Goal.is_completed == False)
    
    goals = query.order_by(Goal.target_date).all()
    
    return [_format_goal_response(g) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific goal by ID"""
    
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    return _format_goal_response(goal)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a goal"""
    
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Update fields
    if goal_update.name is not None:
        goal.name = goal_update.name
    if goal_update.description is not None:
        goal.description = goal_update.description
    if goal_update.target_amount is not None:
        goal.target_amount = goal_update.target_amount
    if goal_update.current_amount is not None:
        goal.current_amount = goal_update.current_amount
    if goal_update.target_date is not None:
        if goal_update.target_date <= date.today() and not goal.is_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target date must be in the future for active goals"
            )
        goal.target_date = goal_update.target_date
    if goal_update.is_completed is not None:
        goal.is_completed = goal_update.is_completed
    
    # Auto-complete if current amount reaches or exceeds target
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    
    db.commit()
    db.refresh(goal)
    
    return _format_goal_response(goal)


@router.post("/{goal_id}/contribute", response_model=GoalResponse)
def contribute_to_goal(
    goal_id: int,
    contribution: GoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add money to a goal"""
    
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    if goal.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot contribute to a completed goal"
        )
    
    # Add contribution
    goal.current_amount += contribution.amount
    
    # Auto-complete if target reached
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    
    db.commit()
    db.refresh(goal)
    
    return _format_goal_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a goal"""
    
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    db.delete(goal)
    db.commit()
    
    return None


def _format_goal_response(goal: Goal) -> dict:
    """Helper function to format goal response with calculated fields"""
    remaining_amount = max(0, goal.target_amount - goal.current_amount)
    progress_percentage = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
    
    # Calculate days remaining
    days_remaining = (goal.target_date - date.today()).days
    
    # Calculate monthly savings needed
    months_remaining = max(1, days_remaining / 30)
    monthly_savings_needed = remaining_amount / months_remaining if not goal.is_completed else 0
    
    # Determine status
    if goal.is_completed:
        status = "completed"
    elif days_remaining < 0:
        status = "overdue"
    elif progress_percentage >= (100 - (days_remaining / ((goal.target_date - date.today()).days + 1) * 100)):
        status = "on_track"
    else:
        status = "behind"
    
    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "name": goal.name,
        "description": goal.description,
        "target_amount": goal.target_amount,
        "current_amount": goal.current_amount,
        "remaining_amount": remaining_amount,
        "progress_percentage": round(progress_percentage, 2),
        "target_date": goal.target_date,
        "days_remaining": max(0, days_remaining),
        "is_completed": goal.is_completed,
        "status": status,
        "monthly_savings_needed": round(monthly_savings_needed, 2)
    }