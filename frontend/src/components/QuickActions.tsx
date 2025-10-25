import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Upload, Download, Target, Calculator, Bell } from "lucide-react";

const QuickActions = () => {
  const actions = [
    {
      title: "Add Expense",
      description: "Record new transaction",
      icon: Plus,
      color: "bg-primary",
      action: "primary"
    },
    {
      title: "Import Data",
      description: "Upload bank statements",
      icon: Upload,
      color: "bg-secondary",
      action: "secondary"
    },
    {
      title: "Export Report",
      description: "Download financial summary",
      icon: Download,
      color: "bg-muted",
      action: "outline"
    },
    {
      title: "Set Budget Goal",
      description: "Configure savings target",
      icon: Target,
      color: "bg-success",
      action: "success"
    },
    {
      title: "Budget Calculator",
      description: "Plan future expenses",
      icon: Calculator,
      color: "bg-warning",
      action: "warning"
    },
    {
      title: "Setup Alerts",
      description: "Configure notifications",
      icon: Bell,
      color: "bg-accent",
      action: "outline"
    }
  ];

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Actions</CardTitle>
          <Badge className="badge-orange">Shortcuts</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant={action.action as any}
                className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-transform"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  action.action === "primary" 
                    ? "bg-primary-foreground/20" 
                    : "bg-primary/10"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    action.action === "primary" 
                      ? "text-primary-foreground" 
                      : "text-primary"
                  }`} />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;