# AI-Financial Advicer

A comprehensive AI-powered financial management application built with React frontend and FastAPI backend.

## Features

### Core Modules

1. **User Management Module**
   - User registration, login, and authentication
   - Personal profiles and secure financial data storage

2. **Data Collection & Expense Tracking Module**
   - Income and expense input with editing/deletion capabilities
   - Transaction export functionality

3. **Expense Categorization (NLP) Module**
   - Automatic expense classification using Natural Language Processing
   - Categories: Food, Transport, Bills, Shopping, Entertainment, Healthcare, etc.

4. **Data Analysis & Visualization Module**
   - Interactive charts and dashboards
   - Income vs expenses visualization
   - Spending habit insights

5. **Budget Forecasting (AI Models) Module**
   - Time-series forecasting for savings and expenses
   - Predictive insights for financial planning

6. **Smart Recommendations (LLM) Module**
   - AI-powered chatbot for financial advice
   - Personalized tips and recommendations

7. **Reporting & Insights Module**
   - Detailed financial reports
   - Monthly/annual summaries
   - Goal tracking and progress evaluation

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- Recharts for data visualization
- React Router for navigation

### Backend
- FastAPI (Python)
- PostgreSQL database
- SQLAlchemy ORM
- JWT authentication
- Pydantic for data validation

### AI/ML Components
- Natural Language Processing for expense categorization
- Time-series forecasting models
- Large Language Model integration for chatbot

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 12+

### Backend Setup (Start First)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables in backend/.env
DATABASE_URL="postgresql://username:password@localhost/ai_financial_advicer"
SECRET_KEY="your-secret-key-here"

# Run the server on port 8000
uvicorn main:app --reload --port 8000
```

Backend API will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Return to root directory
cd ..

# Install dependencies
npm install

# The .env file is already configured to connect to backend
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will be available at `http://localhost:8080`

### Running the Full Stack

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The frontend will automatically connect to the backend API running on port 8000.

### Database Setup

```sql
-- Create database
CREATE DATABASE ai_financial_advicer;

-- Create user (optional)
CREATE USER financial_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_financial_advicer TO financial_user;
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Transactions
- `GET /transactions` - Get user transactions
- `POST /transactions` - Create new transaction

### Analytics
- `GET /analytics/summary` - Get financial summary

### AI Features
- `POST /ai/forecast` - Get financial forecasts
- `POST /ai/chat` - Chat with AI advisor

## Currency

The application uses Indian Rupees (₹) as the primary currency with proper Indian number formatting.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.