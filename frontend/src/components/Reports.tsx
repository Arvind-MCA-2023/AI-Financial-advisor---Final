import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, TrendingUp, PieChart, BarChart3, Mail } from "lucide-react";

const Reports = () => {
  const availableReports = [
    {
      title: "Monthly Financial Summary",
      description: "Comprehensive overview of income, expenses, and savings",
      type: "monthly",
      lastGenerated: "2024-01-15",
      size: "2.4 MB",
      format: "PDF"
    },
    {
      title: "Quarterly Investment Report",
      description: "Portfolio performance and investment recommendations",
      type: "quarterly",
      lastGenerated: "2024-01-01",
      size: "1.8 MB",
      format: "PDF"
    },
    {
      title: "Annual Tax Summary",
      description: "Complete tax-ready financial summary for the year",
      type: "annual",
      lastGenerated: "2023-12-31",
      size: "3.2 MB",
      format: "PDF"
    },
    {
      title: "Expense Category Analysis",
      description: "Detailed breakdown of spending by category with trends",
      type: "analysis",
      lastGenerated: "2024-01-14",
      size: "1.5 MB",
      format: "Excel"
    }
  ];

  const recentInsights = [
    {
      period: "January 2024",
      totalIncome: 820000,
      totalExpenses: 345000,
      netSavings: 475000,
      savingsRate: 58,
      topExpenseCategory: "Bills & Utilities",
      biggestSaving: "Transportation (-15%)"
    },
    {
      period: "December 2023",
      totalIncome: 880000,
      totalExpenses: 420000,
      netSavings: 460000,
      savingsRate: 52,
      topExpenseCategory: "Entertainment",
      biggestSaving: "Food & Dining (-8%)"
    },
    {
      period: "November 2023",
      totalIncome: 820000,
      totalExpenses: 380000,
      netSavings: 440000,
      savingsRate: 54,
      topExpenseCategory: "Shopping",
      biggestSaving: "Bills & Utilities (-5%)"
    }
  ];

  const scheduledReports = [
    {
      name: "Weekly Expense Alert",
      frequency: "Weekly",
      nextRun: "2024-01-22",
      recipients: "john@example.com",
      active: true
    },
    {
      name: "Monthly Financial Summary",
      frequency: "Monthly",
      nextRun: "2024-02-01",
      recipients: "john@example.com, advisor@example.com",
      active: true
    },
    {
      name: "Quarterly Investment Review",
      frequency: "Quarterly",
      nextRun: "2024-04-01",
      recipients: "john@example.com",
      active: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports & Insights</h1>
          <p className="text-muted-foreground">Comprehensive financial reporting and analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="financial-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-muted-foreground">Generated Reports</div>
              </div>
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="financial-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">58%</div>
                <div className="text-sm text-muted-foreground">Avg Savings Rate</div>
              </div>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="financial-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">₹4,75,000</div>
                <div className="text-sm text-muted-foreground">Monthly Savings</div>
              </div>
              <PieChart className="w-5 h-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="financial-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-muted-foreground">Active Schedules</div>
              </div>
              <Mail className="w-5 h-5 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Available Reports</CardTitle>
            <div className="flex items-center space-x-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Last generated: {report.lastGenerated}
                      </span>
                      <Badge variant="outline" className="text-xs">{report.format}</Badge>
                      <span className="text-xs text-muted-foreground">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm">
                    Regenerate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Insights & Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Recent Monthly Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInsights.map((insight, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{insight.period}</h4>
                    <Badge className="badge-orange text-xs">{insight.savingsRate}% saved</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Income</div>
                      <div className="font-medium text-success">+₹{insight.totalIncome.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expenses</div>
                      <div className="font-medium text-destructive">-₹{insight.totalExpenses.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Net Savings</div>
                      <div className="font-medium text-primary">₹{insight.netSavings.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Top Category</div>
                      <div className="font-medium">{insight.topExpenseCategory}</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Biggest saving: <span className="text-success font-medium">{insight.biggestSaving}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledReports.map((schedule, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{schedule.name}</h4>
                    <Badge variant={schedule.active ? "default" : "secondary"} className="text-xs">
                      {schedule.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frequency:</span>
                      <span>{schedule.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next run:</span>
                      <span>{schedule.nextRun}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span className="text-xs">{schedule.recipients.split(',').length} recipient(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant={schedule.active ? "destructive" : "default"} size="sm">
                      {schedule.active ? "Pause" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;