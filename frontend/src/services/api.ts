import axios from 'axios';
import type { HealthStatus } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const sendChatMessage = async (message: string, model?: string): Promise<{
  answer: string;
  metrics: any[];
  warnings: any[];
  table?: any;
}> => {
  const response = await axios.post(`${API_BASE}/chat`, { message, model });
  return response.data;
};

export const checkHealth = async (): Promise<HealthStatus> => {
  const response = await axios.get(`${API_BASE}/health`);
  return response.data;
};
