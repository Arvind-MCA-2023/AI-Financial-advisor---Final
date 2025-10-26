import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import ExpenseTracking from "@/components/ExpenseTracking";
import Analytics from "@/components/Analytics";
import AIForecasting from "@/components/AIForecasting";
import AIAdvisor from "@/components/AIAdvisor";
import Reports from "@/components/Reports";
import BudgetManagement from "@/components/BudgetManagement";
import GoalsManagement from "@/components/GoalsManagement";
import UserProfile from "@/components/UserProfile";
import { apiService } from "@/services/api";

const Index = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Optionally verify token with backend
          // await apiService.getCurrentUser();
          setIsAuthenticated(true);
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userName');
          setIsAuthenticated(false);
          navigate('/signin');
        }
      } else {
        navigate('/signin');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userName');
      setIsAuthenticated(false);
      setActiveModule("dashboard");
      navigate('/');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard />;
      case "expenses":
        return <ExpenseTracking />;
      case "budgets":
        return <BudgetManagement />;
      case "goals":
        return <GoalsManagement />;
      case "analytics":
        return <Analytics />;
      case "forecasting":
        return <AIForecasting />;
      case "advisor":
        return <AIAdvisor />;
      case "reports":
        return <Reports />;
      case "profile":
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-bg">
      <Navigation 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        onLogout={handleLogout}
      />
      
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {renderActiveModule()}
        </div>
      </div>
    </div>
  );
};

export default Index;