export interface MetricWidget {
  title: string;
  value: string;
  subtext?: string;
  type: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

export interface WarningWidget {
  type: string;
  message: string;
}

export interface TableWidget {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

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
