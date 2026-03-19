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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '12345',
      database: 'postgres', // Base de datos por defecto
      entities: [User, File, AIResult, Analysis],
      synchronize: false, // Usaremos los scripts de migración manuales
    }),
    AuthModule,
    UploadModule,
    AnalysisModule,
    ResultsModule
  ],
})
export class AppModule {}