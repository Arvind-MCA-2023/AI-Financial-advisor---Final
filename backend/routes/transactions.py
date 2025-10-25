from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models import User, Transaction
from schemas import TransactionCreate, TransactionResponse, TransactionUpdate
from auth import get_current_user
from nlp_service import ExpenseCategorizer
from datetime import date

router = APIRouter()


@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all transactions for the current user"""
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.date.desc()).all()
    return transactions


@router.post("", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction"""
    # Categorize transaction using NLP
    categorizer = ExpenseCategorizer()
    category = categorizer.categorize(
        transaction.description,
        transaction.amount
    )
    
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


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction by ID"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return transaction


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a transaction"""
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing transaction"""
    
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update fields if provided
    if transaction_update.description is not None:
        transaction.description = transaction_update.description
    if transaction_update.amount is not None:
        transaction.amount = transaction_update.amount
    if transaction_update.category is not None:
        transaction.category = transaction_update.category
    if transaction_update.transaction_type is not None:
        transaction.transaction_type = transaction_update.transaction_type
    if transaction_update.date is not None:
        transaction.date = transaction_update.date
    
    # Re-categorize if description changed and category not explicitly set
    if transaction_update.description and not transaction_update.category:
        # Call your AI categorization function here
        # transaction.category = categorize_transaction(transaction.description)
        pass
    
    transaction.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.get("/filter", response_model=List[TransactionResponse])
def filter_transactions(
    category: str | None = None,
    transaction_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Filter transactions with multiple criteria
    
    - **category**: Filter by category (e.g., "Food & Dining")
    - **transaction_type**: Filter by type ("income" or "expense")
    - **date_from**: Start date (YYYY-MM-DD)
    - **date_to**: End date (YYYY-MM-DD)
    - **min_amount**: Minimum amount
    - **max_amount**: Maximum amount
    - **search**: Search in description (case-insensitive)
    - **limit**: Number of results (default: 100, max: 1000)
    - **offset**: Pagination offset (default: 0)
    """
    
    # Validate limit
    if limit > 1000:
        limit = 1000
    
    # Build query
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    # Apply filters
    if category:
        query = query.filter(Transaction.category == category)
    
    if transaction_type:
        if transaction_type not in ["income", "expense"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="transaction_type must be 'income' or 'expense'"
            )
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if date_from:
        query = query.filter(Transaction.date >= datetime.combine(date_from, datetime.min.time()))
    
    if date_to:
        query = query.filter(Transaction.date <= datetime.combine(date_to, datetime.max.time()))
    
    if min_amount is not None:
        query = query.filter(Transaction.amount >= min_amount)
    
    if max_amount is not None:
        query = query.filter(Transaction.amount <= max_amount)
    
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search}%"))
    
    # Order by date (newest first) and apply pagination
    transactions = query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()
    
    return transactions


@router.get("/stats/category", response_model=dict)
def get_category_statistics(
    date_from: date | None = None,
    date_to: date | None = None,
    transaction_type: str = "expense",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get spending/income statistics grouped by category
    
    - **date_from**: Start date filter
    - **date_to**: End date filter
    - **transaction_type**: "income" or "expense" (default: expense)
    """
    
    if transaction_type not in ["income", "expense"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="transaction_type must be 'income' or 'expense'"
        )
    
    query = db.query(
        Transaction.category,
        db.func.sum(Transaction.amount).label('total'),
        db.func.count(Transaction.id).label('count'),
        db.func.avg(Transaction.amount).label('average')
    ).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_type == transaction_type
    )
    
    if date_from:
        query = query.filter(Transaction.date >= datetime.combine(date_from, datetime.min.time()))
    
    if date_to:
        query = query.filter(Transaction.date <= datetime.combine(date_to, datetime.max.time()))
    
    results = query.group_by(Transaction.category).all()
    
    category_stats = {}
    total_amount = 0
    
    for category, total, count, average in results:
        category_stats[category] = {
            "total": float(total),
            "count": count,
            "average": float(average)
        }
        total_amount += float(total)
    
    # Add percentage for each category
    for category in category_stats:
        category_stats[category]["percentage"] = round(
            (category_stats[category]["total"] / total_amount * 100) if total_amount > 0 else 0,
            2
        )
    
    return {
        "transaction_type": transaction_type,
        "total_amount": total_amount,
        "categories": category_stats,
        "date_from": date_from.isoformat() if date_from else None,
        "date_to": date_to.isoformat() if date_to else None
    }


@router.get("/stats/timeline", response_model=dict)
def get_timeline_statistics(
    date_from: date | None = None,
    date_to: date | None = None,
    group_by: str = "day",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get spending/income over time
    
    - **date_from**: Start date filter
    - **date_to**: End date filter
    - **group_by**: "day", "week", or "month" (default: day)
    """
    
    if group_by not in ["day", "week", "month"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="group_by must be 'day', 'week', or 'month'"
        )
    
    # Set default date range if not provided
    if not date_to:
        date_to = date.today()
    if not date_from:
        from dateutil.relativedelta import relativedelta
        date_from = date_to - relativedelta(months=3)
    
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= datetime.combine(date_from, datetime.min.time()),
        Transaction.date <= datetime.combine(date_to, datetime.max.time())
    )
    
    transactions = query.all()
    
    # Group transactions by time period
    timeline_data = {}
    
    for transaction in transactions:
        if group_by == "day":
            key = transaction.date.strftime("%Y-%m-%d")
        elif group_by == "week":
            key = transaction.date.strftime("%Y-W%U")
        else:  # month
            key = transaction.date.strftime("%Y-%m")
        
        if key not in timeline_data:
            timeline_data[key] = {
                "income": 0,
                "expense": 0,
                "net": 0
            }
        
        if transaction.transaction_type == "income":
            timeline_data[key]["income"] += transaction.amount
        else:
            timeline_data[key]["expense"] += transaction.amount
        
        timeline_data[key]["net"] = timeline_data[key]["income"] - timeline_data[key]["expense"]
    
    # Sort by date
    sorted_timeline = dict(sorted(timeline_data.items()))
    
    return {
        "group_by": group_by,
        "date_from": date_from.isoformat(),
        "date_to": date_to.isoformat(),
        "timeline": sorted_timeline
    }


@router.get("/export", response_model=List[TransactionResponse])
def export_transactions(
    date_from: date | None = None,
    date_to: date | None = None,
    format: str = "json",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export all transactions (for CSV/JSON export on frontend)
    
    - **date_from**: Start date filter
    - **date_to**: End date filter
    - **format**: Export format (currently only "json" supported)
    """
    
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    
    if date_from:
        query = query.filter(Transaction.date >= datetime.combine(date_from, datetime.min.time()))
    
    if date_to:
        query = query.filter(Transaction.date <= datetime.combine(date_to, datetime.max.time()))
    
    transactions = query.order_by(Transaction.date.desc()).all()
    
    return transactions