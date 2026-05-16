import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { memoryStore } from '../shared/inmemory.store';
import { File } from '../entities/file.entity';
import { Analysis } from '../entities/analysis.entity';
import { AIResult } from '../entities/ai-result.entity';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(AIResult)
    private aiResultRepository: Repository<AIResult>,
  ) {}

  private async callAI(filePath: string) {
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || '180000');
    const AI_URL = (process.env.PYTHON_API_URL || process.env.AI_SERVICE_URL || 'http://localhost:5001').replace(/\/+$/, '');
    const FormData = require('form-data');
    const fs = require('fs');
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const lat = process.env.AI_LAT;
    const lon = process.env.AI_LON;
    const date = process.env.AI_DATE;
    const minConf = process.env.MIN_CONFIDENCE || '0.1';
    if (lat) form.append('lat', lat);
    if (lon) form.append('lon', lon);
    if (date) form.append('date', date);
    form.append('min_confidence', minConf);
    const headers = { ...form.getHeaders(), Expect: '' };
    const res = await axios.post(`${AI_URL}/analyze`, form, {
      headers,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: timeoutMs,
    });
    return res?.data || {};
  }

  private buildResultPayload(d: any) {
    return d?.detected === false
      ? {
          detected: false,
          message: d?.message || 'No se detectaron aves con suficiente confianza',
          metadata: d?.metadata || {},
          espectrograma_base64: d?.espectrograma_base64,
          espectrograma_birdnet_base64: d?.espectrograma_birdnet_base64,
          espectrograma_referencia_base64: d?.espectrograma_referencia_base64,
          waveform_pair_base64: d?.waveform_pair_base64,
        }
      : {
          detected: true,
          top3: Array.isArray(d?.top3) ? d.top3 : [],
          metadata: d?.metadata || {},
          espectrograma_base64: d?.espectrograma_base64,
          espectrograma_birdnet_base64: d?.espectrograma_birdnet_base64,
          espectrograma_referencia_base64: d?.espectrograma_referencia_base64,
          waveform_pair_base64: d?.waveform_pair_base64,
        };
  }

  private async processNoDBInBackground(id: string, filePath: string): Promise<void> {
    try {
      const d = await this.callAI(filePath);
      const existing = memoryStore.analyses.get(id);
      memoryStore.analyses.set(id, {
        id,
        filename: filePath,
        status: 'completed',
        result: this.buildResultPayload(d),
        createdAt: existing?.createdAt || new Date(),
      });
    } catch (e: any) {
      const existing = memoryStore.analyses.get(id);
      const errorMsg = e.message || String(e);
      memoryStore.analyses.set(id, {
        id,
        filename: filePath,
        status: 'failed',
        error: `Error en el servicio de IA: ${errorMsg}. Asegúrate de que el servicio Python esté corriendo.`,
        createdAt: existing?.createdAt || new Date(),
      });
    }
  }

  private async processDBInBackground(analysisId: string, filePath: string): Promise<void> {
    const analysis = await this.analysisRepository.findOne({ where: { id: analysisId } });
    if (!analysis) return;

    try {
      const d = await this.callAI(filePath);
      const top3 = Array.isArray(d?.top3) ? d.top3 : [];
      const top1 = top3?.[0] || null;
      const especie = typeof top1?.species === 'string' ? top1.species : 'Sin detección';
      const probabilidad = typeof top1?.confidence === 'number' ? top1.confidence : 0;
      const metadata = d?.metadata || {};
      const metadataToStore =
        d?.detected === false
          ? { ...metadata, detected: false, message: d?.message || 'No se detectaron aves con suficiente confianza' }
          : { ...metadata, detected: true };

      const ai = this.aiResultRepository.create({
        especie,
        probabilidad,
        top3Json: JSON.stringify(top3),
        espectrogramaBase64: d?.spectrograma_base64 || d?.espectrograma_base64 || null,
        espectrogramaBirdnetBase64: d?.espectrograma_birdnet_base64 || null,
        espectrogramaReferenciaBase64: d?.espectrograma_referencia_base64 || null,
        waveformPairBase64: d?.waveform_pair_base64 || null,
        metadataJson: JSON.stringify(metadataToStore),
        detectionsJson: JSON.stringify(d?.detections || d?.detecciones || []),
      });
      await this.aiResultRepository.save(ai);

      analysis.status = 'done';
      analysis.aiResultId = ai.id;
      await this.analysisRepository.save(analysis);
    } catch {
      analysis.status = 'failed';
      await this.analysisRepository.save(analysis);
    }
  }

  async queueAndProcess(filePath: string): Promise<string> {
    if (process.env.DISABLE_DB === 'true') {
      const id = `${Date.now()}`;
      memoryStore.analyses.set(id, {
        id,
        filename: filePath,
        status: 'processing',
        createdAt: new Date(),
      });
      void this.processNoDBInBackground(id, filePath);
      return id;
    }

    try {
      const file = this.fileRepository.create({ path: filePath, mimeType: 'audio', size: 0 });
      await this.fileRepository.save(file);
      
      const analysis = this.analysisRepository.create({ fileId: file.id, status: 'running' });
      await this.analysisRepository.save(analysis);
      void this.processDBInBackground(analysis.id, filePath);
      return analysis.id;
    } catch {
      const id = `${Date.now()}`;
      memoryStore.analyses.set(id, {
        id,
        filename: filePath,
        status: 'processing',
        createdAt: new Date(),
      });
      void this.processNoDBInBackground(id, filePath);
      return id;
    }
  }
}
