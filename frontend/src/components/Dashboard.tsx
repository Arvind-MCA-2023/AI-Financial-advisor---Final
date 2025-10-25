import DashboardStats from "@/components/DashboardStats";
import ExpenseChart from "@/components/ExpenseChart";
import AIInsights from "@/components/AIInsights";
import QuickActions from "@/components/QuickActions";
import RecentTransactions from "@/components/RecentTransactions";
import heroImage from "@/assets/financial-hero.jpg";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/api";

const Dashboard = () => {
  const { data: analytics, loading: analyticsLoading } = useApi(() => 
    apiService.getIncomeExpenseSummary()
  );
  
  const { data: transactions, loading: transactionsLoading } = useApi(() => 
    apiService.getTransactions({ limit: 5 })
  );

  const user_name = localStorage.getItem('userName');

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        <img 
          src={heroImage} 
          alt="Financial Dashboard Analytics" 
          className="w-full h-64 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent flex items-center">
          <div className="px-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome, {user_name ? ` ${user_name}` : ' User'}!
            </h1>
            <p className="text-xl text-muted-foreground mb-4">
              Smart insights, automated tracking, and personalized recommendations
            </p>
            <div className="flex items-center space-x-2">
              <span className="badge-orange">Machine Learning Powered</span>
              <span className="badge-orange">Real-time Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats analytics={analytics} loading={analyticsLoading} />

      {/* Charts Section */}
      <ExpenseChart />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentTransactions transactions={transactions} loading={transactionsLoading} />
          <QuickActions />
        </div>
        <div className="lg:col-span-1">
          <AIInsights />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;