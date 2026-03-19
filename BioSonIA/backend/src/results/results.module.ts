import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResultsController } from './results.controller';
import { Analysis } from '../entities/analysis.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Analysis]), AuthModule],
  controllers: [ResultsController],
})
export class ResultsModule {}
