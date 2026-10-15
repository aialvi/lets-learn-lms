import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUrl } from 'class-validator';

export class CreateCourseDto {
  @ApiPropertyOptional({ description: 'Course cover image URL' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({ description: 'Course title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Course price', example: 99.99 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsNotEmpty()
  @IsString()
  instructorId: string;
}
