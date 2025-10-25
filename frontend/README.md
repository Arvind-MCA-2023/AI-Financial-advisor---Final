# AI Financial Advisor - Frontend

This is the React frontend for the AI Financial Advisor application, built with React, TypeScript, Tailwind CSS, and Vite.

## Features

- **Dashboard**: Overview of financial metrics and insights
- **Expense Tracking**: Add, edit, and categorize transactions
- **Analytics**: Visual charts and spending analysis
- **AI Forecasting**: Predictive analytics using machine learning
- **AI Advisor**: Conversational AI for financial recommendations
- **Reports**: Generate and view financial reports
- **Authentication**: User login and registration

## Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Radix UI** - Component primitives
- **Lucide React** - Icons
- **Chart.js / Recharts** - Data visualization

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Update the API URL in `.env`:
```
REACT_APP_API_URL=http://localhost:8000
```

4. Start the development server:
```bash
npm run dev
```

## Backend Integration

The frontend is designed to work with a FastAPI backend. Key integration points:

- **Authentication**: JWT-based login/logout
- **Transactions**: CRUD operations for financial data
- **AI Features**: NLP categorization and forecasting
- **Real-time Updates**: Live data synchronization

## API Configuration

Update the API base URL in `src/services/api.ts` or use environment variables:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Components Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Navigation.tsx  # App navigation
│   └── ...
├── services/           # API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript types
└── pages/              # Page components
```

## Development

The app includes:
- Hot reloading for development
- TypeScript for type safety
- ESLint for code quality
- Responsive design
- Dark/light mode support

## Mock Data

The app works with mock data when the backend is not available, making it easy to develop and test features independently.