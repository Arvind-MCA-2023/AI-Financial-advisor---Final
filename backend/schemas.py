from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Transaction schemas
class TransactionBase(BaseModel):
    description: str
    amount: float
    transaction_type: str

class TransactionCreate(TransactionBase):
    date: Optional[datetime] = None

class TransactionUpdate(BaseModel):
    description: str | None
    amount: float | None
    category: str | None
    transaction_type: str | None
    date: datetime | None

class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    date: datetime
    category : Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Budget schemas
class BudgetBase(BaseModel):
    category: str
    monthly_limit: float

# Goal schemas
class GoalBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_amount: float
    target_date: datetime

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[datetime] = None

class GoalResponse(GoalBase):
    id: int
    user_id: int
    current_amount: float
    is_completed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics schemas
class AnalyticsSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    category_breakdown: dict

class MonthlyData(BaseModel):
    month: str
    income: float
    expenses: float
    savings: float

class ForecastData(BaseModel):
    month: str
    predicted_amount: float
    confidence: float

class ChatMessage(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    timestamp: str

class InsightRequest(BaseModel):
    user_id: int

class InsightResponse(BaseModel):
    insights: List[dict]

class ForecastRequest(BaseModel):
    months: int = 3

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

# Add these to your existing schemas.py file

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============================================
# AI Chat Schemas
# ============================================

class ChatMessage(BaseModel):
    """Request schema for AI chat"""
    message: str = Field(..., min_length=1, max_length=1000, description="User's message to AI")
    conversation_history: List[Dict[str, str]] = Field(
        default=[],
        description="Previous messages in format: [{'type': 'user'|'bot', 'content': '...'}]"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "How can I reduce my food expenses?",
                "conversation_history": [
                    {"type": "user", "content": "Hello"},
                    {"type": "bot", "content": "Hi! How can I help with your finances?"}
                ]
            }
        }


class ChatResponse(BaseModel):
    """Response schema for AI chat"""
    response: str = Field(..., description="AI's response message")
    timestamp: str = Field(..., description="ISO format timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response": "Here are 3 ways to reduce food expenses...",
                "timestamp": "2024-12-15T10:30:00"
            }
        }


# ============================================
# AI Insights Schemas
# ============================================

class Insight(BaseModel):
    """Individual financial insight"""
    type: str = Field(..., description="Type: positive, warning, or opportunity")
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=500)
    confidence: str = Field(..., description="Confidence level as percentage (e.g., '92%')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "positive",
                "title": "Excellent Savings Rate",
                "message": "You saved ₹45,000 this month, 30% above your average!",
                "confidence": "92%"
            }
        }


class InsightResponse(BaseModel):
    """Response containing multiple insights"""
    insights: List[Insight] = Field(..., min_length=1, max_length=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "insights": [
                    {
                        "type": "positive",
                        "title": "Great Progress",
                        "message": "Your savings increased by 25% this month",
                        "confidence": "95%"
                    }
                ]
            }
        }


# ============================================
# AI Tips Schemas
# ============================================

class FinancialTip(BaseModel):
    """Individual financial tip"""
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    impact: str = Field(..., description="Impact level: High, Medium, or Low")
    difficulty: str = Field(..., description="Difficulty: Easy, Medium, or Hard")
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Automate Savings",
                "description": "Set up automatic transfers to save 20% of income effortlessly.",
                "impact": "High",
                "difficulty": "Easy"
            }
        }


class TipsResponse(BaseModel):
    """Response containing financial tips"""
    tips: List[FinancialTip] = Field(..., min_length=1, max_length=10)
    
    class Config:
        json_schema_extra = {
            "example": {
                "tips": [
                    {
                        "title": "Track Daily Expenses",
                        "description": "Monitor spending daily to identify savings opportunities.",
                        "impact": "Medium",
                        "difficulty": "Easy"
                    }
                ]
            }
        }


# ============================================
# Forecasting Schemas
# ============================================

class MonthlyForecast(BaseModel):
    """Single month forecast data"""
    month: str = Field(..., description="Month name and year (e.g., 'January 2025')")
    predicted_expenses: int = Field(..., ge=0, description="Predicted expenses in rupees")
    lower_bound: Optional[int] = Field(None, ge=0, description="Lower confidence bound")
    upper_bound: Optional[int] = Field(None, ge=0, description="Upper confidence bound")
    confidence: int = Field(..., ge=0, le=100, description="Confidence percentage")
    
    class Config:
        json_schema_extra = {
            "example": {
                "month": "January 2025",
                "predicted_expenses": 45000,
                "lower_bound": 38000,
                "upper_bound": 52000,
                "confidence": 92
            }
        }


class ModelInfo(BaseModel):
    """Information about the forecasting model"""
    algorithm: str = Field(..., description="Algorithm used for forecasting")
    data_points: int = Field(..., ge=0, description="Number of data points used for training")
    training_period: str = Field(..., description="Date range of training data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "algorithm": "Facebook Prophet",
                "data_points": 45,
                "training_period": "2024-10-01 to 2024-12-15"
            }
        }


class TrendAnalysis(BaseModel):
    """Trend analysis for forecast period"""
    direction: str = Field(..., description="Trend direction: increasing, decreasing, or stable")
    change_percentage: float = Field(..., description="Percentage change over forecast period")
    message: str = Field(..., description="Human-readable trend description")
    
    class Config:
        json_schema_extra = {
            "example": {
                "direction": "increasing",
                "change_percentage": 4.4,
                "message": "Expected increase of 4.4% over forecast period"
            }
        }


class ForecastResponse(BaseModel):
    """Complete forecast response"""
    forecast: List[MonthlyForecast] = Field(..., description="Monthly forecast predictions")
    method: str = Field(..., description="Forecasting method used: prophet, statistical, or none")
    model_info: Optional[ModelInfo] = Field(None, description="Model training information")
    trend_analysis: Optional[TrendAnalysis] = Field(None, description="Trend analysis")
    message: Optional[str] = Field(None, description="Additional message (e.g., errors, warnings)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "forecast": [
                    {
                        "month": "January 2025",
                        "predicted_expenses": 45000,
                        "lower_bound": 38000,
                        "upper_bound": 52000,
                        "confidence": 92
                    }
                ],
                "method": "prophet",
                "model_info": {
                    "algorithm": "Facebook Prophet",
                    "data_points": 45,
                    "training_period": "2024-10-01 to 2024-12-15"
                },
                "trend_analysis": {
                    "direction": "increasing",
                    "change_percentage": 4.4,
                    "message": "Expected increase of 4.4% over forecast period"
                }
            }
        }


# ============================================
# Category Forecast Schemas
# ============================================

class CategoryForecast(BaseModel):
    """Forecast for a specific expense category"""
    category: str = Field(..., description="Expense category name")
    current_monthly_avg: int = Field(..., ge=0, description="Current monthly average in rupees")
    predicted_next_month: int = Field(..., ge=0, description="Predicted next month expenses")
    trend_percentage: float = Field(..., description="Trend percentage (+ or -)")
    confidence: int = Field(..., ge=0, le=100, description="Confidence percentage")
    
    class Config:
        json_schema_extra = {
            "example": {
                "category": "Food & Dining",
                "current_monthly_avg": 15000,
                "predicted_next_month": 16200,
                "trend_percentage": 8.0,
                "confidence": 85
            }
        }


class CategoryForecastResponse(BaseModel):
    """Response containing category-wise forecasts"""
    category_forecasts: List[CategoryForecast] = Field(..., description="Forecast for each category")
    total_predicted: int = Field(..., ge=0, description="Total predicted expenses across all categories")
    forecast_period: str = Field(..., description="Forecast time period")
    message: Optional[str] = Field(None, description="Additional message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "category_forecasts": [
                    {
                        "category": "Food & Dining",
                        "current_monthly_avg": 15000,
                        "predicted_next_month": 16200,
                        "trend_percentage": 8.0,
                        "confidence": 85
                    }
                ],
                "total_predicted": 45000,
                "forecast_period": "next_month"
            }
        }


# ============================================
# Request Schemas (Optional)
# ============================================

class ForecastRequest(BaseModel):
    """Optional request body for forecast endpoint"""
    months: int = Field(3, ge=1, le=12, description="Number of months to forecast")
    category: Optional[str] = Field(None, description="Specific category to forecast")
    include_confidence_intervals: bool = Field(True, description="Include confidence bounds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "months": 3,
                "category": "Food & Dining",
                "include_confidence_intervals": True
            }
        }