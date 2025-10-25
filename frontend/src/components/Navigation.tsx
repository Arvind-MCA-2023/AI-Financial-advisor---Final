import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  TrendingUp, 
  MessageSquare, 
  FileText,
  User,
  Settings
} from "lucide-react";

interface NavigationProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onLogout?: () => void;
}

const Navigation = ({ activeModule, setActiveModule, onLogout }: NavigationProps) => {
  const modules = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "expenses", label: "Expense Tracking", icon: Receipt },
    { id: "analytics", label: "Analytics", icon: PieChart },
    { id: "forecasting", label: "AI Forecasting", icon: TrendingUp },
    { id: "advisor", label: "AI Advisor", icon: MessageSquare },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI-Financial Advicer</h1>
            <Badge className="badge-orange text-xs">AI-Powered</Badge>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-1">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Button
                key={module.id}
                variant={activeModule === module.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveModule(module.id)}
                className="flex items-center space-x-2"
              >
                <Icon className="w-4 h-4" />
                <span>{module.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <Button variant="outline" size="sm">
          <User className="w-4 h-4 mr-2" />
          Profile
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
        {onLogout && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onLogout}
            className="text-destructive hover:text-destructive"
          >
            Logout
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;