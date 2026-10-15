import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsBoolean, IsDateString, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export const MODULES = ['teams', 'assessments', 'certifications', 'reminders', 'reports'] as const;
export const ROLES = ['admin', 'instructor', 'manager', 'learner'];
export class OrganizationDto {
  @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsIn(['academic', 'professional']) mode: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsEmail() adminEmail?: string;
}
export class SettingsDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @IsIn(['academic', 'professional']) mode?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsArray() @ArrayUnique() @IsIn(MODULES, { each: true }) modules?: string[];
}
export class InvitationDto {
  @IsEmail() email: string;
  @IsIn(ROLES) role: string;
}
export class AcceptInvitationDto { @IsString() @IsNotEmpty() token: string; }
export class MembershipDto {
  @IsOptional() @IsIn(ROLES) role?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() departmentId?: string | null;
}
export class DepartmentDto { @IsString() @IsNotEmpty() @MaxLength(120) name: string; }
export class TeamMemberDto {
  @IsString() @IsNotEmpty() membershipId: string;
  @IsBoolean() isManager: boolean;
}
export class TeamDto extends DepartmentDto {
  @IsOptional() @IsString() departmentId?: string;
  @IsArray() @ArrayMaxSize(500) @ValidateNested({ each: true }) @Type(() => TeamMemberDto) members: TeamMemberDto[];
}
export class LessonInput {
  @IsOptional() @IsString() id?: string;
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(50000) content?: string;
  @IsOptional() @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) videoUrl?: string;
}
export class QuestionInput {
  @IsIn(['choice', 'boolean']) type: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) prompt: string;
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(10) @IsString({ each: true }) options: string[];
  @IsInt() @Min(0) correctIndex: number;
}
export class QuizInput {
  @IsInt() @Min(1) @Max(100) passPercent: number = 80;
  @IsOptional() @IsInt() @Min(1) @Max(100) maxAttempts?: number | null;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => QuestionInput) questions: QuestionInput[];
}
export class OrganizationCourseDto {
  @IsString() @IsNotEmpty() @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => LessonInput) lessons: LessonInput[];
  @IsOptional() @ValidateNested() @Type(() => QuizInput) quiz?: QuizInput | null;
  @IsBoolean() certificationEnabled: boolean = false;
  @IsOptional() @IsInt() @Min(1) @Max(120) validityMonths?: number | null;
  @IsIn(['full', 'quiz']) renewalMode: string = 'full';
}
export class AssignmentDto {
  @IsString() courseId: string;
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(500) @IsString({ each: true }) userIds?: string[];
  @IsOptional() @IsString() teamId?: string;
  @IsOptional() @IsDateString() dueAt?: string;
}
export class AnswersDto { @IsArray() @ArrayMaxSize(100) @IsInt({ each: true }) answers: number[]; }
export class LessonCompletionDto { @IsString() lessonId: string; }
