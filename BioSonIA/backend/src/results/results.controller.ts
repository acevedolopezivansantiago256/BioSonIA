import { Controller, Get, Param } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { memoryStore, AnalysisRecord } from '../shared/inmemory.store';

const prisma = new PrismaClient();

@Controller()
export class ResultsController {
  @Get('results/:id')
  async getResult(@Param('id') id: string) {
    if (process.env.DISABLE_DB === 'true') {
      const rec = memoryStore.analyses.get(id);
      if (!rec || !rec.result) return {};
      return rec.result;
    }
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: { aiResult: true }
    });
    if (!analysis || !analysis.aiResult) return {};
    const r = analysis.aiResult;
    return {
      especie_predicha: r.especie,
      probabilidad: r.probabilidad,
      top3: JSON.parse(r.top3Json || '[]'),
      espectrograma_base64: r.espectrogramaBase64,
      detecciones: JSON.parse((r as any).detectionsJson || '[]'),
      metadatos: JSON.parse(r.metadataJson || '{}')
    };
  }

  @Get('history')
  async history() {
    if (process.env.DISABLE_DB === 'true') {
      const arr = Array.from(memoryStore.analyses.values()) as AnalysisRecord[];
      return arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    const list = await prisma.analysis.findMany({ include: { aiResult: true }, orderBy: { createdAt: 'desc' } });
    return list;
  }
}