import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionAnswerDto {
  @ApiProperty({ description: 'Question ID' })
  @IsNotEmpty()
  @IsString()
  questionId: string;

  @ApiProperty({ description: 'Selected option ID' })
  @IsNotEmpty()
  @IsString()
  selectedOptionId: string;
}

export class SubmitQuizDto {
  @ApiProperty({ type: [QuestionAnswerDto], description: 'Answers to questions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers: QuestionAnswerDto[];
}
