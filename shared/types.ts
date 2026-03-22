export interface TopClass {
  especie: string;
  prob: number;
}

export interface AIResultPayload {
  especie_predicha: string;
  probabilidad: number;
  top3: TopClass[];
  espectrograma_base64?: string;
  metadatos?: Record<string, any>;
}

export interface AnalysisRecord {
  id: string;
  fileId: string;
  userId?: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  aiResultId?: string;
  createdAt: string;
}