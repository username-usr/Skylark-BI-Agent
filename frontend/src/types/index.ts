export interface AIModelOption {
  id: string;
  name: string;
  tag: string;
  provider: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite", tag: "Fast & High Quota", provider: "Google" },
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Deep Reasoning", provider: "Google" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", tag: "Free Tier", provider: "OpenRouter" },
  { id: "deepseek/deepseek-r1:free", name: "DeepSeek R1", tag: "Reasoning Free", provider: "OpenRouter" },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", tag: "Exp Free", provider: "OpenRouter" }
];

export interface MetricWidget {
  title: string;
  value: string;
  subtext?: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export type MetricCard = MetricWidget;

export interface WarningWidget {
  type: string;
  message: string;
}

export type QualityWarning = WarningWidget;

export interface TableWidget {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export type BreakdownTableData = TableWidget;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  metrics?: MetricWidget[];
  warnings?: WarningWidget[];
  table?: TableWidget;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthStatus {
  status: string;
  monday_connection: {
    mcp_url: string;
    has_api_key: boolean;
    deals_board: boolean;
    work_orders_board: boolean;
    deals_item_count: number;
    work_orders_item_count: number;
    source: string;
  };
}
