import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class StudyCoachDto {
  @IsString()
  @MaxLength(1200)
  prompt: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  intent?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recentCourseIds?: string[];
}
