import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [AnalysisModule],
  controllers: [UploadController],
})
export class UploadModule {}