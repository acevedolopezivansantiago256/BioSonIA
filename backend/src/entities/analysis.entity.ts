import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { File } from './file.entity';
import { AIResult } from './ai-result.entity';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  status!: string;

  @OneToOne(() => File, (file) => file.analysis)
  @JoinColumn({ name: 'file_id' })
  file!: File;

  @Column({ name: 'file_id', unique: true })
  fileId!: string;

  @ManyToOne(() => User, (user) => user.analyses, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', nullable: true })
  userId!: string;

  @OneToOne(() => AIResult, (aiResult) => aiResult.analysis, { nullable: true })
  @JoinColumn({ name: 'ai_result_id' })
  aiResult!: AIResult;

  @Column({ name: 'ai_result_id', unique: true, nullable: true })
  aiResultId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
