import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ResultsModule } from './results/results.module';
import { User } from './entities/user.entity';
import { File } from './entities/file.entity';
import { AIResult } from './entities/ai-result.entity';
import { Analysis } from './entities/analysis.entity';
import * as dotenv from 'dotenv';

dotenv.config();

function envOrThrow(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envOrThrow('DB_HOST'),
      port: Number(envOrThrow('DB_PORT')),
      username: envOrThrow('DB_USER'),
      password: envOrThrow('DB_PASSWORD'),
      database: envOrThrow('DB_NAME'),
      entities: [User, File, AIResult, Analysis],
      synchronize: false,
    }),
    AuthModule,
    UploadModule,
    AnalysisModule,
    ResultsModule
  ],
})
export class AppModule {}
