import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { memoryStore } from '../shared/inmemory.store';

const prisma = new PrismaClient();

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
          const minConf = process.env.MIN_CONFIDENCE || '0.6';
          if (lat) form.append('lat', lat);
          if (lon) form.append('lon', lon);
          if (date) form.append('date', date);
          form.append('min_confidence', minConf);
          const headers = form.getHeaders();
          return axios.post(`${AI_URL}/analyze`, form, { headers });
        })();
        const result = {
          especie_predicha: res.data.especie_predicha,
          probabilidad: res.data.probabilidad,
          top3: res.data.top3,
          espectrograma_base64: res.data.espectrograma_base64 || null,
          espectrograma_birdnet_base64: res.data.espectrograma_birdnet_base64 || null,
          waveform_pair_base64: res.data.waveform_pair_base64 || null,
          detecciones: res.data.detecciones || [],
          metadatos: res.data.metadatos || {}
        };
        memoryStore.analyses.set(id, {
          id,
          filename: filePath,
          status: 'completed',
          result,
          createdAt: new Date(),
        });
      } catch (e) {
        // Fallback: si la IA no está disponible, genera un resultado de ejemplo
        const mock = {
          especie_predicha: 'Ave desconocida',
          probabilidad: 0.42,
          top3: [
            { especie: 'Ave A', probabilidad: 0.42 },
            { especie: 'Ave B', probabilidad: 0.33 },
            { especie: 'Ave C', probabilidad: 0.25 }
          ],
          espectrograma_base64: null,
          metadatos: { fuente: 'mock', motivo: 'AI no disponible' }
        };
        memoryStore.analyses.set(id, {
          id,
          filename: filePath,
          status: 'completed',
          result: mock,
          createdAt: new Date(),
        });
      }
      return id;
    }

    // Flujo normal con Prisma
    const file = await prisma.file.create({
      data: { path: filePath, mimeType: 'audio', size: 0 },
    });
    const analysis = await prisma.analysis.create({
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
        const minConf = process.env.MIN_CONFIDENCE || '0.6';
        if (lat) form.append('lat', lat);
        if (lon) form.append('lon', lon);
        if (date) form.append('date', date);
        form.append('min_confidence', minConf);
        const headers = form.getHeaders();
        return axios.post(`${AI_URL}/analyze`, form, { headers });
      })();
      const ai = await prisma.aIResult.create({
        data: {
          especie: res.data.especie_predicha,
          probabilidad: res.data.probabilidad,
          top3Json: JSON.stringify(res.data.top3),
          espectrogramaBase64: res.data.espectrograma_base64 || null,
          metadataJson: JSON.stringify(res.data.metadatos || {}),
          detectionsJson: JSON.stringify(res.data.detecciones || [])
        }
      });
      await prisma.analysis.update({ where: { id: analysis.id }, data: { status: 'done', aiResultId: ai.id } });
    } catch (e) {
      await prisma.analysis.update({ where: { id: analysis.id }, data: { status: 'failed' } });
    }
    return analysis.id;
  }
}