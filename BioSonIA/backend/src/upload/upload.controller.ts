import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import type { Multer } from 'multer';
import { AnalysisService } from '../analysis/analysis.service';
import * as path from 'path';
import * as fs from 'fs';

// Guardar archivos en <cwd>/uploads (evita duplicar 'backend/backend')
const uploadPath = path.join(process.cwd(), 'uploads');
// Asegura que exista el directorio
try { fs.mkdirSync(uploadPath, { recursive: true }); } catch {}

@Controller('upload')
export class UploadController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req: Request, file: Express.Multer.File, cb: (error: any, destination: string) => void) => {
        try { fs.mkdirSync(uploadPath, { recursive: true }); } catch {}
        cb(null, uploadPath);
      },
      filename: (req: Request, file: Express.Multer.File, cb: (error: any, filename: string) => void) => cb(null, `${Date.now()}_${file.originalname}`),
    }),
    limits: { fileSize: 25 * 1024 * 1024 },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const analysisId = await this.analysisService.queueAndProcess(file.path);
    return { analysisId };
  }
}