import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Analysis } from './analysis.entity';

@Entity('ai_results')
export class AIResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  especie!: string;

  @Column('float')
  probabilidad!: number;

  @Column({ type: 'text', nullable: true, name: 'top3_json' })
  top3Json!: string;

  @Column({ type: 'text', nullable: true, name: 'espectrograma_base64' })
  espectrogramaBase64!: string;

  @Column({ type: 'text', nullable: true, name: 'espectrograma_birdnet_base64' })
  espectrogramaBirdnetBase64!: string;

  @Column({ type: 'text', nullable: true, name: 'espectrograma_referencia_base64' })
  espectrogramaReferenciaBase64!: string;

  @Column({ type: 'text', nullable: true, name: 'waveform_pair_base64' })
  waveformPairBase64!: string;

  @Column({ type: 'text', nullable: true, name: 'metadata_json' })
  metadataJson!: string;

  @Column({ type: 'text', nullable: true, name: 'detections_json' })
  detectionsJson!: string;

  @OneToOne(() => Analysis, (analysis) => analysis.aiResult)
  analysis!: Analysis;
}
