import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewPrescriptionDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  notes?: string;
}
