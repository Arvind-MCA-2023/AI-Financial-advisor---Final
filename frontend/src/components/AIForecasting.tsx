// Replace frontend/src/components/AIForecasting.tsx with this

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, Zap, RefreshCw, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

const AIForecasting = () => {
  const { toast } = useToast();
  const [months, setMonths] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch forecast data
  const { data: forecastData, loading: forecastLoading, refetch: refetchForecast } = useApi(
    () => apiService.getExpenseForecast({ 
      months, 
      category: selectedCategory !== "all" ? selectedCategory : undefined 
    }),
    [months, selectedCategory, refreshKey]
  );

  // Fetch category forecast
  const { data: categoryData, loading: categoryLoading, refetch: refetchCategory } = useApi(
    () => apiService.getCategoryForecast(1),
    [refreshKey]
  );

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshing forecast",
      description: "Retraining AI models with latest data...",
    });
  };

  const getTrendIcon = (direction: string) => {
    if (direction === "increasing") return <TrendingUp className="w-4 h-4" />;
    if (direction === "decreasing") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (direction: string) => {
    if (direction === "increasing") return "text-destructive";
    if (direction === "decreasing") return "text-success";
    return "text-muted-foreground";
  };

  const getMethodBadge = (method: string) => {
    const badges = {
      prophet: { label: "Prophet ML", className: "bg-blue-500 text-white" },
      statistical: { label: "Statistical", className: "bg-purple-500 text-white" },
      none: { label: "No Data", className: "bg-gray-500 text-white" }
    };
    return badges[method as keyof typeof badges] || badges.none;
  };

  if (forecastLoading && !forecastData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Training AI models...</p>
        </div>
      </div>
    );
  }

  if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <Brain className="w-6 h-6 text-primary" />
              <span>AI Budget Forecasting</span>
            </h1>
            <p className="text-muted-foreground">Machine learning predictions for your financial future</p>
          </div>
        </div>
        <Card className="financial-card">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Insufficient Data</h3>
            <p className="text-muted-foreground mb-4">
              {forecastData?.message || "Add at least 3 days of transactions to enable AI forecasting"}
            </p>
            <Button onClick={() => window.location.href = "/expenses"}>
              Add Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const methodBadge = getMethodBadge(forecastData.method);
  const trend = forecastData.trend_analysis;

  // Prepare chart data
  const chartData = forecastData.forecast.map(item => ({
    month: item.month.split(' ')[0].slice(0, 3),
    predicted: item.predicted_expenses,
    lower: item.lower_bound || item.predicted_expenses * 0.85,
    upper: item.upper_bound || item.predicted_expenses * 1.15,
    confidence: item.confidence
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary" />
            <span>AI Budget Forecasting</span>
          </h1>
          <p className="text-muted-foreground">
            {forecastData.model_info?.algorithm || "Statistical"} predictions for your financial future
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={methodBadge.className}>
            {methodBadge.label}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={forecastLoading}>
            {forecastLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Forecast Period:</label>
          <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Month</SelectItem>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {categoryData && categoryData.category_forecasts && categoryData.category_forecasts.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Category:</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryData.category_forecasts.map(cat => (
                  <SelectItem key={cat.category} value={cat.category}>
                    {cat.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Forecast Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="financial-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  ₹{forecastData.forecast[forecastData.forecast.length - 1]?.predicted_expenses.toLocaleString('en-IN')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Predicted {forecastData.forecast[forecastData.forecast.length - 1]?.month}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-primary">
                  {forecastData.forecast[forecastData.forecast.length - 1]?.confidence}% confidence
                </div>
                <div className="text-xs text-muted-foreground">
                  {forecastData.method === 'prophet' ? 'ML Model' : 'Statistical'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {trend && (
          <>
            <Card className={`financial-card border-${trend.direction === 'increasing' ? 'destructive' : 'success'}/20`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-2xl font-bold flex items-center space-x-2 ${getTrendColor(trend.direction)}`}>
                      {getTrendIcon(trend.direction)}
                      <span>{Math.abs(trend.change_percentage).toFixed(1)}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground">Trend Direction</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium capitalize">{trend.direction}</div>
                    <div className="text-xs text-muted-foreground">
                      {months}-month period
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="financial-card border-muted/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {forecastData.model_info?.data_points || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Data Points Used</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {forecastData.model_info?.algorithm || 'Statistical'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ML Algorithm
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Forecast Chart */}
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Forecast with Confidence Intervals</CardTitle>
            {forecastData.model_info && (
              <Badge variant="outline">
                Training: {forecastData.model_info.training_period}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#confidenceGradient)"
                name="Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--background))"
                name="Lower Bound"
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                name="Predicted"
                dot={{ fill: 'hsl(var(--primary))', r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {trend && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Model Insight:</strong> {trend.message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Forecasts */}
      {categoryData && categoryData.category_forecasts && categoryData.category_forecasts.length > 0 && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Category Forecast (Next Month)</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse p-4 rounded-lg bg-muted/20">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {categoryData.category_forecasts.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: ₹{item.current_monthly_avg.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="font-semibold text-lg">
                          ₹{item.predicted_next_month.toLocaleString('en-IN')}
                        </div>
                        <div className={`text-sm flex items-center justify-end space-x-1 ${
                          item.trend_percentage > 0 ? "text-destructive" : "text-success"
                        }`}>
                          {item.trend_percentage > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{Math.abs(item.trend_percentage).toFixed(1)}%</span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {item.confidence}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Total Predicted Next Month
                  </div>
                  <div className="text-xl font-bold">
                    ₹{categoryData.total_predicted.toLocaleString('en-IN')}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card className="financial-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trend && trend.direction === 'increasing' && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Rising Expenses Detected</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your expenses are trending upward by {Math.abs(trend.change_percentage).toFixed(1)}%. 
                      Consider reviewing your budget and identifying areas to optimize.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {trend && trend.direction === 'decreasing' && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-start space-x-3">
                  <TrendingDown className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Great Progress!</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your expenses are decreasing by {Math.abs(trend.change_percentage).toFixed(1)}%. 
                      Keep up the good work! Consider redirecting these savings to your financial goals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-start space-x-3">
                <Brain className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Improve Forecast Accuracy</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {forecastData.method === 'prophet' 
                      ? 'Your forecast is using advanced ML. Continue tracking expenses regularly to maintain accuracy.'
                      : `Add ${Math.max(0, 10 - (forecastData.model_info?.data_points || 0))} more days of transactions to unlock Prophet ML forecasting for better predictions.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIForecasting;