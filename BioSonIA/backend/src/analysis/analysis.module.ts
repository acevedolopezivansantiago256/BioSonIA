import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { File } from '../entities/file.entity';
import { Analysis } from '../entities/analysis.entity';
import { AIResult } from '../entities/ai-result.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, Analysis, AIResult])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}