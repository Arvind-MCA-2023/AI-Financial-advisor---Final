import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Lightbulb, TrendingUp, PiggyBank, AlertTriangle, Loader2 } from "lucide-react";
import { useApi, useAsyncAction } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Insight, Tip, Message } from "@/types/ai";

const AIAdvisor = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      content: "Hello! I'm your AI Financial Advisor powered by advanced language models. I've analyzed your spending patterns and I'm ready to help you optimize your finances. What would you like to know?",
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load AI insights
  const { data: insightsData, loading: insightsLoading } = useApi<{ insights: Insight[] }>(() => 
    apiService.getAIInsights()
  );

  // Load financial tips
  const { data: tipsData, loading: tipsLoading } = useApi<{ tips: Tip[] }>(() => 
    apiService.getFinancialTips()
  );

  const quickQuestions = [
    "How can I reduce my monthly expenses?",
    "What's the best savings strategy for me?",
    "Should I invest my emergency fund?",
    "Help me create a budget plan",
    "Analyze my spending patterns",
    "How to improve my credit score?"
  ];

  const defaultTips: Tip[] = [
    {
      icon: PiggyBank,
      title: "Automate Your Savings",
      description: "Set up automatic transfers to save 20% of your income without thinking about it.",
      impact: "High",
      difficulty: "Easy"
    },
    {
      icon: TrendingUp,
      title: "Diversify Investments",
      description: "Consider index funds to spread risk across multiple stocks and sectors.",
      impact: "High",
      difficulty: "Medium"
    },
    {
      icon: AlertTriangle,
      title: "Emergency Fund Priority",
      description: "Build 6 months of expenses in savings before aggressive investing.",
      impact: "Critical",
      difficulty: "Medium"
    }
  ];

  const defaultInsights: Insight[] = [
    {
      type: "positive",
      title: "Great Progress!",
      message: "Analyzing your financial data...",
      confidence: "...",
    },
  ];

  const personalizedInsights = insightsData?.insights || defaultInsights;
  const financialTips = tipsData?.tips.map(tip => ({
    ...tip,
    icon: tip.impact === "High" ? TrendingUp : tip.impact === "Critical" ? AlertTriangle : PiggyBank
  })) || defaultTips;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage: Message = {
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      // Call AI chat API
      const response = await apiService.chatWithAdvisor(inputMessage, messages);
      
      const botMessage: Message = {
        type: "bot",
        content: response.response,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
      
      // Add error message
      const errorMessage: Message = {
        type: "bot",
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputMessage(question);
  };

  const getInsightStyles = (type: string) => {
    switch (type) {
      case "positive":
        return "border-success bg-success/5";
      case "warning":
        return "border-warning bg-warning/5";
      case "opportunity":
        return "border-primary bg-primary/5";
      default:
        return "border-muted bg-muted/5";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Bot className="w-6 h-6 text-primary" />
            <span>AI Financial Advisor</span>
          </h1>
          <p className="text-muted-foreground">Get personalized financial advice powered by large language models</p>
        </div>
        <Badge className="badge-orange">Groq LLM Powered</Badge>
      </div>

      {/* Personalized Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insightsLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="financial-card animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          personalizedInsights.map((insight, index) => (
            <Card key={index} className={`financial-card border-l-4 ${getInsightStyles(insight.type)}`}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{insight.message}</p>
                <Badge variant="outline" className="text-xs">
                  {insight.confidence} confidence
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="financial-card h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>AI Chat Assistant</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-6">
              {/* Messages */}
              <div className="flex-1 space-y-4 mb-4 overflow-y-auto pr-2 scroll-smooth" style={{ maxHeight: 'calc(600px - 180px)' }}>
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] flex items-start space-x-2 ${
                      message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.type === "user" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        {message.type === "user" ? 
                          <User className="w-4 h-4" /> : 
                          <Bot className="w-4 h-4" />
                        }
                      </div>
                      <div className={`rounded-lg p-3 ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="rounded-lg p-3 bg-muted flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about your finances..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                  disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !inputMessage.trim()}>
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Questions */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-sm">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-3 text-xs"
                    onClick={() => handleQuickQuestion(question)}
                    disabled={isSending}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Tips */}
          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Lightbulb className="w-4 h-4" />
                <span>Smart Tips</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tipsLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg border animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {financialTips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-start space-x-2">
                          <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-sm">{tip.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {tip.impact} Impact
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {tip.difficulty}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;