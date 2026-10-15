import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
export class RegisterDto {
  @IsString() @MinLength(3) @MaxLength(80) username: string;
  @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(6) @MaxLength(200) password: string;
  @IsOptional() @IsString() @MaxLength(100) firstName?: string;
  @IsOptional() @IsString() @MaxLength(100) lastName?: string;
}
