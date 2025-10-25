import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAsyncAction } from "@/hooks/useApi";
import { apiService } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import { X, Plus } from "lucide-react";

interface AddTransactionFormProps {
  onSuccess: () => void;
}

const AddTransactionForm = ({ onSuccess }: AddTransactionFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    transaction_type: "expense" as "income" | "expense",
    date: new Date().toISOString().split('T')[0]
  });

  const { toast } = useToast();
  const { execute: createTransaction, loading } = useAsyncAction(
    (transactionData: typeof form) => apiService.createTransaction({
      ...transactionData,
      amount: parseFloat(transactionData.amount)
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.description || !form.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const result = await createTransaction(form);
    
    if (result) {
      toast({
        title: "Transaction added",
        description: "Your transaction has been successfully added.",
      });
      onSuccess();
      setIsOpen(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to add transaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="flex items-center space-x-2">
        <Plus className="w-4 h-4" />
        <span>Add Transaction</span>
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md financial-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Add New Transaction</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="Enter transaction description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select 
                value={form.transaction_type} 
                onValueChange={(value: "income" | "expense") => setForm(prev => ({ ...prev, transaction_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Adding..." : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    )}
    </>
  );
};

export default AddTransactionForm;