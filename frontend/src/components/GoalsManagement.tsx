import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useApi, useAsyncAction } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Target, TrendingUp, Calendar, DollarSign, Trash2 } from "lucide-react";
import { Goal } from "@/types/api";

const GoalsManagement = () => {
  const { toast } = useToast();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [contributingTo, setContributingTo] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  
  const [newGoal, setNewGoal] = useState({
    name: "",
    description: "",
    target_amount: "",
    current_amount: "0",
    target_date: "",
  });

  // Fetch goals
  const { data: goals, loading, refetch } = useApi<Goal[]>(() => 
    apiService.getGoals(showCompleted) as Promise<Goal[]>,
    [showCompleted]
  );

  const { execute: createGoal, loading: creating } = useAsyncAction(
    (goal: typeof newGoal) => apiService.createGoal({
      ...goal,
      target_amount: parseFloat(goal.target_amount),
      current_amount: parseFloat(goal.current_amount || "0")
    })
  );

  const { execute: contribute } = useAsyncAction(
    (id: number, amount: number) => apiService.contributeToGoal(id, amount)
  );

  const { execute: deleteGoal } = useAsyncAction(
    (id: number) => apiService.deleteGoal(id)
  );

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const result = await createGoal(newGoal);
    
    if (result) {
      toast({
        title: "Goal Created",
        description: "Your financial goal has been successfully created",
      });
      setNewGoal({ name: "", description: "", target_amount: "", current_amount: "0", target_date: "" });
      setIsAddingGoal(false);
      refetch();
    }
  };

  const handleContribute = async (goalId: number) => {
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount",
        variant: "destructive"
      });
      return;
    }

    const result = await contribute(goalId, parseFloat(contributionAmount));
    
    if (result) {
      toast({
        title: "Contribution Added",
        description: `₹${parseFloat(contributionAmount).toLocaleString('en-IN')} added to goal`,
      });
      setContributingTo(null);
      setContributionAmount("");
      refetch();
    }
  };

  const handleDeleteGoal = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the goal "${name}"?`)) {
      const result = await deleteGoal(id);
      if (result !== null) {
        toast({
          title: "Goal Deleted",
          description: "The goal has been removed",
        });
        refetch();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/10 text-success border-success";
      case "on_track": return "bg-primary/10 text-primary border-primary";
      case "behind": return "bg-warning/10 text-warning border-warning";
      case "overdue": return "bg-destructive/10 text-destructive border-destructive";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Goals</h1>
          <p className="text-muted-foreground">Track and achieve your financial objectives</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>
          <Button onClick={() => setIsAddingGoal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {/* Add Goal Form */}
      {isAddingGoal && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Create New Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Goal Name *</Label>
                  <Input
                    placeholder="e.g., Emergency Fund"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Amount (₹) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500000"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newGoal.current_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, current_amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Date *</Label>
                  <Input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    placeholder="Describe your goal..."
                    value={newGoal.description}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Goal"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsAddingGoal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="financial-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals && goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="financial-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                    </div>
                    <Badge className={getStatusColor(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal.id, goal.name)}
                    disabled={goal.is_completed}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      ₹{goal.current_amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of ₹{goal.target_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{goal.progress_percentage.toFixed(1)}% complete</span>
                      <span>{goal.days_remaining} days remaining</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          goal.is_completed
                            ? 'bg-success'
                            : goal.status === 'on_track'
                            ? 'bg-primary'
                            : goal.status === 'behind'
                            ? 'bg-warning'
                            : 'bg-destructive'
                        }`}
                        style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                      <div className="font-semibold">₹{goal.remaining_amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Monthly Need</div>
                      <div className="font-semibold">₹{goal.monthly_savings_needed.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                    <Calendar className="w-3 h-3" />
                    <span>Target: {new Date(goal.target_date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Contribution Section */}
                {!goal.is_completed && (
                  <div className="mt-4 pt-4 border-t">
                    {contributingTo === goal.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          className="flex-1"
                        />
                        <Button size="sm" onClick={() => handleContribute(goal.id)}>
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setContributingTo(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="w-full" 
                        onClick={() => setContributingTo(goal.id)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Contribution
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="financial-card">
          <CardContent className="p-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {showCompleted 
                ? "No completed goals yet. Keep working towards your objectives!"
                : "No active goals found. Click 'Add Goal' to create one."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoalsManagement;