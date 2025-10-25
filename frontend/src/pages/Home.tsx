import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3, Brain, LineChart } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-bg">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-20">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">AI Financial Advisor</span>
          </div>
          <div className="flex gap-4">
            <Link to="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            AI Financial Advisor
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Smart insights for your financial future. Track expenses, get AI-powered forecasts, and make better financial decisions.
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Link to="/register">
              <Button size="lg" className="text-lg px-8">
                Start Free
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
            <div className="financial-card text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Expense Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your spending with intuitive analytics and insights
              </p>
            </div>

            <div className="financial-card text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized financial advice powered by advanced AI
              </p>
            </div>

            <div className="financial-card text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <LineChart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Smart Forecasting</h3>
              <p className="text-sm text-muted-foreground">
                Predict future trends and plan your financial goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
