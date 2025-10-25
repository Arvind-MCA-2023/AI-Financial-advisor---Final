import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, MessageSquare } from "lucide-react";

const AIInsights = () => {
  const insights = [
    {
      type: "forecast",
      title: "Budget Forecast",
      message: "Based on your spending patterns, you're likely to save $4,750 by the end of this month.",
      confidence: "95%",
      icon: TrendingUp,
      variant: "success"
    },
    {
      type: "warning",
      title: "Spending Alert",
      message: "Your entertainment spending is 40% higher than usual. Consider reviewing recent transactions.",
      confidence: "87%",
      icon: AlertTriangle,
      variant: "warning"
    },
    {
      type: "recommendation",
      title: "Smart Tip",
      message: "Switch to the premium savings account to earn 2.3% more interest on your current balance.",
      confidence: "92%",
      icon: Lightbulb,
      variant: "info"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="financial-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Financial Insights</CardTitle>
                <p className="text-sm text-muted-foreground">Powered by advanced machine learning</p>
              </div>
            </div>
            <Badge className="badge-orange">Real-time</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.variant === "success"
                    ? "bg-success/5 border-success"
                    : insight.variant === "warning"
                    ? "bg-warning/5 border-warning"
                    : "bg-primary/5 border-primary"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {insight.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Chat Assistant</CardTitle>
            <Badge className="badge-orange">Available 24/7</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              "Hi! I noticed you've been spending less on groceries this month. Would you like me to analyze your food budget and suggest optimizations?"
            </p>
          </div>
          <Button className="w-full" variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInsights;