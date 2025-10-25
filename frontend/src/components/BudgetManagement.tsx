import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApi, useAsyncAction } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Budget } from "@/types/api";

const BudgetManagement = () => {
  const { toast } = useToast();
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [newBudget, setNewBudget] = useState({
    category: "",
    monthly_limit: "",
    month: selectedMonth,
    year: selectedYear,
  });

  // Fetch budgets
  const { data: budgets, loading, refetch } = useApi<Budget[]>(() => 
    apiService.getBudgets({ month: selectedMonth, year: selectedYear }) as Promise<Budget[]>,
    [selectedMonth, selectedYear]
  );

  const { execute: createBudget, loading: creating } = useAsyncAction(
    (budget: typeof newBudget) => apiService.createBudget({
      ...budget,
      monthly_limit: parseFloat(budget.monthly_limit)
    })
  );

  const { execute: deleteBudget } = useAsyncAction(
    (id: number) => apiService.deleteBudget(id)
  );

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newBudget.category || !newBudget.monthly_limit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const result = await createBudget(newBudget);
    
    if (result) {
      toast({
        title: "Budget Created",
        description: "Your budget has been successfully created",
      });
      setNewBudget({ category: "", monthly_limit: "", month: selectedMonth, year: selectedYear });
      setIsAddingBudget(false);
      refetch();
    }
  };

  const handleDeleteBudget = async (id: number, category: string) => {
    if (confirm(`Are you sure you want to delete the budget for ${category}?`)) {
      const result = await deleteBudget(id);
      if (result !== null) {
        toast({
          title: "Budget Deleted",
          description: "The budget has been removed",
        });
        refetch();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "under_budget": return "bg-success/10 text-success border-success";
      case "near_limit": return "bg-warning/10 text-warning border-warning";
      case "over_budget": return "bg-destructive/10 text-destructive border-destructive";
      default: return "bg-muted";
    }
  };

  const categories = [
    "Food & Dining",
    "Transportation", 
    "Shopping",
    "Entertainment",
    "Bills & Utilities",
    "Healthcare",
    "Education",
    "Travel",
    "Personal Care",
    "Groceries"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">Track and manage your monthly budgets</p>
        </div>
        <Button onClick={() => setIsAddingBudget(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Month/Year Selector */}
      <Card className="financial-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>Period:</Label>
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <SelectItem key={i} value={(new Date().getFullYear() - 2 + i).toString()}>
                    {new Date().getFullYear() - 2 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add Budget Form */}
      {isAddingBudget && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Create New Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newBudget.category} 
                    onValueChange={(v) => setNewBudget(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Limit (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={newBudget.monthly_limit}
                    onChange={(e) => setNewBudget(prev => ({ ...prev, monthly_limit: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 flex items-end gap-2">
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? "Creating..." : "Create Budget"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingBudget(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budgets List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="financial-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets && budgets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <Card key={budget.id} className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{budget.category}</h3>
                    <Badge className={getStatusColor(budget.status)}>
                      {budget.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBudget(budget.id, budget.category)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spent:</span>
                    <span className="font-medium">₹{budget.current_spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limit:</span>
                    <span className="font-medium">₹{budget.monthly_limit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className={`font-medium ${budget.remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                      ₹{Math.abs(budget.remaining).toLocaleString('en-IN')}
                      {budget.remaining < 0 && " over"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{budget.percentage_used.toFixed(1)}% used</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        budget.percentage_used >= 100
                          ? 'bg-destructive'
                          : budget.percentage_used >= 80
                          ? 'bg-warning'
                          : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(budget.percentage_used, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="financial-card">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No budgets found for this period. Click "Add Budget" to create one.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetManagement;