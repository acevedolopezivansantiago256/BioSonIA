import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ResultsModule } from './results/results.module';

@Module({
  imports: [AuthModule, UploadModule, AnalysisModule, ResultsModule],
})
export class AppModule {}