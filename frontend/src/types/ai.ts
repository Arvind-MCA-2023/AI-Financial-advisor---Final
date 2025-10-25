export interface Message {
  type: "user" | "bot";
  content: string;
  timestamp: string;
}

export interface Insight {
  type: "positive" | "opportunity" | "warning";
  title: string;
  message: string;
  confidence: string;
}

export interface Tip {
  title: string;
  description: string;
  impact: string;
  difficulty: string;
  icon?: any;
}