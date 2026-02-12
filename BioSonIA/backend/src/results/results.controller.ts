import { Controller, Get, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { memoryStore, AnalysisRecord } from '../shared/inmemory.store';

let prisma: PrismaClient | null = null;

const normalizeTop3 = (raw: any): Array<{ species: string; confidence: number }> => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      if (t && typeof t === 'object') {
        if (typeof t.species === 'string' && typeof t.confidence === 'number') {
          return { species: t.species, confidence: t.confidence };
        }
        if (typeof t.especie === 'string') {
          const p = typeof t.probabilidad === 'number' ? t.probabilidad : typeof t.prob === 'number' ? t.prob : 0;
          return { species: t.especie, confidence: p };
        }
      }
      return null;
    })
    .filter((x): x is { species: string; confidence: number } => Boolean(x));
};

@Controller()
export class ResultsController {
  @Get('results/:id')
  async getResult(@Param('id') id: string) {
    if (process.env.DISABLE_DB === 'true') {
      const rec = memoryStore.analyses.get(id);
      if (!rec || !rec.result) return {};
      return rec.result;
    }
    try {
      const client = prisma ?? (prisma = new PrismaClient());
      const analysis = await client.analysis.findUnique({ where: { id }, include: { aiResult: true } });
      if (!analysis || !analysis.aiResult) return {};
      const r = analysis.aiResult;
      const top3 = normalizeTop3(JSON.parse(r.top3Json || '[]'));
      const metadata = JSON.parse(r.metadataJson || '{}');
      const detected = metadata?.detected === false ? false : top3.length > 0;
      if (!detected) {
        return { detected: false, message: metadata?.message || 'No se detectaron aves con suficiente confianza' };
      }
      return {
        detected: true,
        top3,
        metadata,
        espectrograma_base64: r.espectrogramaBase64,
        espectrograma_birdnet_base64: r.espectrogramaBirdnetBase64,
        waveform_pair_base64: r.waveformPairBase64
      };
    } catch {
      const rec = memoryStore.analyses.get(id);
      if (!rec || !rec.result) return {};
      return rec.result;
    }
  }

  @Get('history')
  async history() {
    if (process.env.DISABLE_DB === 'true') {
      const arr = Array.from(memoryStore.analyses.values()) as AnalysisRecord[];
      return arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    try {
      const client = prisma ?? (prisma = new PrismaClient());
      const list = await client.analysis.findMany({ include: { aiResult: true }, orderBy: { createdAt: 'desc' } });
      return list;
    } catch {
      const arr = Array.from(memoryStore.analyses.values()) as AnalysisRecord[];
      return arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  }
}
