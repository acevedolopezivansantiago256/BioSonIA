import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis } from '../entities/analysis.entity';
import { memoryStore, AnalysisRecord } from '../shared/inmemory.store';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
  ) {}

  @Get('results/:id')
  async getResult(@Param('id') id: string) {
    const rec = memoryStore.analyses.get(id);
    if (process.env.DISABLE_DB === 'true' || rec) {
      if (!rec) return {};
      if (!rec.result) {
        return {
          status: rec.status,
          message: rec.error || (rec.status === 'failed' ? 'El analisis fallo.' : 'Analizando audio...'),
        };
      }
      return rec.result;
    }
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) return {};

    const analysis = await this.analysisRepository.findOne({
      where: { id },
      relations: ['aiResult']
    });
    
    if (!analysis) return {};
    if (!analysis.aiResult) {
      return {
        status: analysis.status,
        message: analysis.status === 'failed' ? 'El analisis fallo.' : 'Analizando audio...',
      };
    }
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
      espectrograma_referencia_base64: r.espectrogramaReferenciaBase64,
      waveform_pair_base64: r.waveformPairBase64
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async history() {
    if (process.env.DISABLE_DB === 'true') {
      const arr = Array.from(memoryStore.analyses.values()) as AnalysisRecord[];
      return arr.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    
    const list = await this.analysisRepository.find({
      relations: ['aiResult'],
      order: { createdAt: 'DESC' }
    });
    return list;
  }
}
