import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOptionDto {
  @ApiProperty({ description: 'Option text' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ description: 'Whether this option is correct' })
  isCorrect: boolean;

  @ApiProperty({ description: 'Option order' })
  order: number;
}

export class CreateQuestionDto {
  @ApiProperty({ description: 'Question type: multiple_choice or true_false' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ description: 'Question text' })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiProperty({ description: 'Question order' })
  order: number;

  @ApiProperty({ type: [CreateOptionDto], description: 'Question options' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ description: 'Quiz title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Quiz description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Course ID' })
  @IsNotEmpty()
  @IsString()
  courseId: string;

  @ApiProperty({ type: [CreateQuestionDto], description: 'Quiz questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
