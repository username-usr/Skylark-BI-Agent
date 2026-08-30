export interface AIModelOption {
  id: string;
  name: string;
  tag: string;
  provider: string;
}

export const AVAILABLE_MODELS: AIModelOption[] = [
  { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash-Lite", tag: "Fast & High Quota", provider: "Google" },
  { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", tag: "Deep Reasoning", provider: "Google" },
  { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B", tag: "Flagship Open-Source", provider: "OpenRouter" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", tag: "Reasoning Model", provider: "OpenRouter" },
  { id: "qwen/qwen-2.5-72b-instruct", name: "Qwen 2.5 72B", tag: "High Performance", provider: "OpenRouter" }
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
