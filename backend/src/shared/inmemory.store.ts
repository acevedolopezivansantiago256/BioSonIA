export type AnalysisRecord = {
  id: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
};

class InMemoryStore {
  analyses = new Map<string, AnalysisRecord>();
}

export const memoryStore = new InMemoryStore();