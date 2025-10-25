from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserCreate, UserLogin
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    create_refresh_token,
    verify_refresh_token
)

router = APIRouter()


@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists by email
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username is taken
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
    
    return {
        "message": "User created successfully",
        "user_id": db_user.id
    }


@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )
    
    # Create both access and refresh tokens
    access_token = create_access_token(data={"sub": db_user.username})
    refresh_token = create_refresh_token(data={"sub": db_user.username})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_name": db_user.full_name,
        "user_id": db_user.id,
        "email": db_user.email
    }


@router.post("/refresh")
async def refresh_access_token(refresh_token: str, db: Session = Depends(get_db)):
    """Get new access token using refresh token"""
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    username = payload.get("sub")
    
    if not username:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )
    
    # Get user
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    # Check if user is active
    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )
    
    # Create new access token
    new_access_token = create_access_token(data={"sub": db_user.username})
    
    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client-side token removal)"""
    return {
        "message": "Successfully logged out. Please remove tokens from client storage."
    }