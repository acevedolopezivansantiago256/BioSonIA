import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { Analysis } from './analysis.entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  path!: string;

  @Column({ name: 'mime_type' })
  mimeType!: string;

  @Column('int')
  size!: number;

  @Column('float', { nullable: true })
  duration!: number;

  @ManyToOne(() => User, (user) => user.files, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'user_id', nullable: true })
  userId!: string;

  @OneToOne(() => Analysis, (analysis) => analysis.file)
  analysis!: Analysis;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
