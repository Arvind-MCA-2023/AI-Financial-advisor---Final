import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Car, 
  Coffee, 
  Zap, 
  Smartphone,
  MoreHorizontal,
  Eye,
  DollarSign
} from "lucide-react";
import { Transaction } from "@/types/api";

interface RecentTransactionsProps {
  transactions?: Transaction[];
  loading?: boolean;
}

const RecentTransactions = ({ transactions: apiTransactions, loading }: RecentTransactionsProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food & dining':
      case 'food':
        return Coffee;
      case 'transportation':
      case 'transport':
        return Car;
      case 'shopping':
        return ShoppingBag;
      case 'bills & utilities':
      case 'utilities':
        return Zap;
      case 'income':
        return DollarSign;
      default:
        return Smartphone;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'food & dining':
      case 'food':
        return 'text-primary';
      case 'transportation':
      case 'transport':
        return 'text-warning';
      case 'shopping':
        return 'text-purple-500';
      case 'bills & utilities':
      case 'utilities':
        return 'text-destructive';
      case 'income':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayTransactions = apiTransactions || [
    {
      id: 1,
      description: "Big Bazaar",
      category: "Food & Dining",
      amount: -8750,
      date: "Today, 2:30 PM",
      icon: ShoppingBag,
      color: "text-primary",
      aiCategory: true
    },
    {
      id: 2,
      description: "Petrol Pump",
      category: "Transportation",
      amount: -4520,
      date: "Today, 9:15 AM",
      icon: Car,
      color: "text-warning",
      aiCategory: true
    },
    {
      id: 3,
      description: "Salary Deposit",
      category: "Income",
      amount: 420000,
      date: "Yesterday",
      icon: Smartphone,
      color: "text-success",
      aiCategory: false
    },
    {
      id: 4,
      description: "Cafe Coffee Day",
      category: "Food & Dining",
      amount: -1245,
      date: "Yesterday, 8:00 AM",
      icon: Coffee,
      color: "text-primary",
      aiCategory: true
    },
    {
      id: 5,
      description: "Electric Bill",
      category: "Bills & Utilities",
      amount: -12000,
      date: "2 days ago",
      icon: Zap,
      color: "text-destructive",
      aiCategory: true
    }
  ];

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="badge-orange">Auto-categorized</Badge>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayTransactions.map((transaction) => {
            const Icon = apiTransactions ? getCategoryIcon(transaction.category) : transaction.icon;
            const color = apiTransactions ? getCategoryColor(transaction.category) : transaction.color;
            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{transaction.description}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">{transaction.category}</span>
                      {(apiTransactions || transaction.aiCategory) && (
                        <Badge variant="outline" className="text-xs px-1">AI</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${
                    (apiTransactions ? transaction.transaction_type === 'income' : transaction.amount > 0) ? "text-success" : "text-foreground"
                  }`}>
                    {(apiTransactions ? transaction.transaction_type === 'income' : transaction.amount > 0) ? "+" : "-"}₹{(apiTransactions ? transaction.amount : Math.abs(transaction.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {apiTransactions ? new Date(transaction.date).toLocaleDateString() : transaction.date}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;