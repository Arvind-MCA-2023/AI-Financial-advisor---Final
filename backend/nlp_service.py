import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()
class ExpenseCategorizer:
    """AI-powered expense categorizer using LangChain and Groq"""
    
    # Standard expense categories
    CATEGORIES = [
        "Food & Dining",
        "Transportation",
        "Shopping",
        "Entertainment",
        "Bills & Utilities",
        "Healthcare",
        "Education",
        "Travel",
        "Personal Care",
        "Groceries",
        "Income",
        "Other"
    ]
    
    def __init__(self, api_key: str = None, model: str = "llama-3.1-8b-instant"):
        """
        Initialize the expense categorizer
        
        Args:
            api_key: Groq API key (if not set via environment variable)
            model: Groq model to use
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY must be set as environment variable or passed to constructor")
        
        # Initialize Groq LLM
        self.llm = ChatGroq(
            api_key=self.api_key,
            model=model,
            temperature=0  # Low temperature for consistent categorization
        )
        
        # Create prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert expense categorization assistant. 
Categorize expenses accurately based on the description and amount.

Available categories: {categories}

Rules:
- Return ONLY the category name, nothing else
- Choose the most appropriate category
- If unsure, use 'Other'
- Consider common merchant names and transaction patterns"""),
            ("human", "Categorize this expense:\nDescription: {description}\nAmount: ${amount}")
        ])
        
        # Create chain
        self.chain = self.prompt | self.llm | StrOutputParser()
    
    def categorize(self, description: str, amount: float) -> str:
        """
        Categorize a single expense
        
        Args:
            description: Transaction description
            amount: Transaction amount
            
        Returns:
            Category name
        """
        try:
            category = self.chain.invoke({
                "categories": ", ".join(self.CATEGORIES),
                "description": description,
                "amount": f"{amount:.2f}"
            })
            
            # Clean up response and validate
            category = category.strip()
            if category not in self.CATEGORIES:
                # Try to find closest match
                category_lower = category.lower()
                for valid_cat in self.CATEGORIES:
                    if valid_cat.lower() in category_lower or category_lower in valid_cat.lower():
                        return valid_cat
                return "Other"
            
            return category
        except Exception as e:
            print(f"Error categorizing expense: {e}")
            return "Other"
    
    # def categorize_batch(self, expenses: List[Dict[str, any]]) -> List[Dict[str, any]]:
    #     """
    #     Categorize multiple expenses
        
    #     Args:
    #         expenses: List of expense dicts with 'description' and 'amount' keys
            
    #     Returns:
    #         List of expense dicts with added 'category' key
    #     """
    #     categorized = []
    #     for expense in expenses:
    #         category = self.categorize(
    #             expense.get("description", ""),
    #             expense.get("amount", 0.0)
    #         )
    #         categorized.append({
    #             **expense,
    #             "category": category
    #         })
    #     return categorized


# Example usage
if __name__ == "__main__":
    # Initialize categorizer
    categorizer = ExpenseCategorizer()
    
    # Sample expenses
    expenses = [
        {"description": "Starbucks Coffee", "amount": 5.75},
        {"description": "Uber ride to office", "amount": 15.20},
        {"description": "Amazon - Kitchen supplies", "amount": 45.99},
        {"description": "Netflix subscription", "amount": 15.99},
        {"description": "Shell Gas Station", "amount": 52.00},
        {"description": "Whole Foods Market", "amount": 87.43},
        {"description": "CVS Pharmacy", "amount": 23.50},
        {"description": "Electric Bill - ConEd", "amount": 125.00},
        {"description": "Planet Fitness Membership", "amount": 29.99},
        {"description": "Salary Deposit", "amount": 3500.00},
    ]
    
    # Categorize expenses
    print("Categorizing expenses...\n")
    categorized_expenses = categorizer.categorize_batch(expenses)
    
    # Display results
    print(f"{'Description':<35} {'Amount':>10} {'Category':<20}")
    print("-" * 70)
    for exp in categorized_expenses:
        print(f"{exp['description']:<35} ${exp['amount']:>9.2f} {exp['category']:<20}")
    
    # Category summary
    print("\n\nCategory Summary:")
    print("-" * 40)
    category_totals = {}
    for exp in categorized_expenses:
        cat = exp['category']
        category_totals[cat] = category_totals.get(cat, 0) + exp['amount']
    
    for cat, total in sorted(category_totals.items(), key=lambda x: x[1], reverse=True):
        print(f"{cat:<25} ${total:>10.2f}")