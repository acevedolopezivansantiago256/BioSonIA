import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { memoryStore } from '../shared/inmemory.store';

let prisma: PrismaClient | null = null;

@Injectable()
export class AnalysisService {
  async queueAndProcess(filePath: string): Promise<string> {
    // Modo sin BD: usa almacenamiento en memoria
    if (process.env.DISABLE_DB === 'true') {
      const id = `${Date.now()}`;
      memoryStore.analyses.set(id, {
        id,
        filename: filePath,
        status: 'processing',
        createdAt: new Date(),
      });
      try {
        const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
        const res = await (async () => {
          const FormData = require('form-data');
          const fs = require('fs');
          const form = new FormData();
          form.append('file', fs.createReadStream(filePath));
          // Parámetros opcionales para BirdNET
          const lat = process.env.AI_LAT;
          const lon = process.env.AI_LON;
          const date = process.env.AI_DATE;
          const minConf = process.env.MIN_CONFIDENCE || '0.3';
          if (lat) form.append('lat', lat);
          if (lon) form.append('lon', lon);
          if (date) form.append('date', date);
          form.append('min_confidence', minConf);
          const headers = { ...form.getHeaders(), Expect: '' };
          return axios.post(`${AI_URL}/analyze`, form, { headers, maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 60000 });
        })();
        const d = res?.data || {};
        const result =
          d?.detected === false
            ? {
              detected: false,
              message: d?.message || 'No se detectaron aves con suficiente confianza',
              espectrograma_base64: d?.espectrograma_base64,
              espectrograma_birdnet_base64: d?.espectrograma_birdnet_base64,
              waveform_pair_base64: d?.waveform_pair_base64,
            }
            : {
              detected: true,
              top3: Array.isArray(d?.top3) ? d.top3 : [],
              metadata: d?.metadata || {},
              espectrograma_base64: d?.espectrograma_base64,
              espectrograma_birdnet_base64: d?.espectrograma_birdnet_base64,
              waveform_pair_base64: d?.waveform_pair_base64,
            };
        memoryStore.analyses.set(id, {
          id,
          filename: filePath,
          status: 'completed',
          result,
          createdAt: new Date(),
        });
      } catch (e: any) {
        console.error('AI Service Error:', e);
        const errorMsg = e.message || String(e);
        memoryStore.analyses.set(id, {
          id,
          filename: filePath,
          status: 'completed',
          result: {
            detected: false,
            message: `Error en el servicio de IA: ${errorMsg}. Asegúrate de que el servicio Python esté corriendo.`
          },
          createdAt: new Date(),
        });
      }
      return id;
    }

    // Flujo normal con Prisma
    const client = prisma ?? (prisma = new PrismaClient());
    const file = await client.file.create({
      data: { path: filePath, mimeType: 'audio', size: 0 },
    });
    const analysis = await client.analysis.create({
      data: { fileId: file.id, status: 'running' },
    });
    try {
      const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
      const res = await (async () => {
        const FormData = require('form-data');
        const fs = require('fs');
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        // Parámetros opcionales para BirdNET
        const lat = process.env.AI_LAT;
        const lon = process.env.AI_LON;
        const date = process.env.AI_DATE;
        const minConf = process.env.MIN_CONFIDENCE || '0.3';
        if (lat) form.append('lat', lat);
        if (lon) form.append('lon', lon);
        if (date) form.append('date', date);
        form.append('min_confidence', minConf);
        const headers = { ...form.getHeaders(), Expect: '' };
        return axios.post(`${AI_URL}/analyze`, form, { headers, maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 60000 });
      })();
      const d = res?.data || {};
      const top3 = Array.isArray(d?.top3) ? d.top3 : [];
      const top1 = top3?.[0] || null;
      const especie = typeof top1?.species === 'string' ? top1.species : 'Sin detección';
      const probabilidad = typeof top1?.confidence === 'number' ? top1.confidence : 0;
      const metadata = d?.metadata || {};
      const metadataToStore =
        d?.detected === false
          ? { ...metadata, detected: false, message: d?.message || 'No se detectaron aves con suficiente confianza' }
          : { ...metadata, detected: true };
      const ai = await client.aIResult.create({
        data: {
          especie,
          probabilidad,
          top3Json: JSON.stringify(top3),
          espectrogramaBase64: d?.spectrograma_base64 || d?.espectrograma_base64 || null,
          espectrogramaBirdnetBase64: d?.espectrograma_birdnet_base64 || null,
          waveformPairBase64: d?.waveform_pair_base64 || null,
          metadataJson: JSON.stringify(metadataToStore),
          detectionsJson: JSON.stringify(d?.detections || d?.detecciones || [])
        }
      });
      await client.analysis.update({ where: { id: analysis.id }, data: { status: 'done', aiResultId: ai.id } });
    } catch (e: any) {
      // In DB mode, we might want to store the error or mark as failed.
      // For now, let's mark as failed but maybe update the logic to store a failed result if possible?
      // The current logic marks status='failed', which results in Frontend showing "Error loading results".
      // Let's print the error at least.
      console.error('AI Service Error (DB):', e);
      await client.analysis.update({ where: { id: analysis.id }, data: { status: 'failed' } });
    }
    return analysis.id;
  }
}
