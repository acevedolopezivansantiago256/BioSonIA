 import { Body, Controller, Post } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  async start(@Body() body: any) {
    const filePath = body.filePath;
    if (!filePath) return { ok: false, message: 'filePath requerido' };
    const analysisId = await this.analysisService.queueAndProcess(filePath);
    return { ok: true, analysisId };
  }
}