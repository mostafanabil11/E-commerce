import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { GenderEnum, ProviderEnum } from '../common/enums';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ValidateIf(
    (dto: CreateUserDto) =>
      dto.provider === ProviderEnum.SYSTEM || !dto.provider,
  )
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password?: string;

  @ValidateIf(
    (dto: CreateUserDto) =>
      dto.provider === ProviderEnum.SYSTEM || !dto.provider,
  )
  @IsString({ message: 'Confirm password must be a string' })
  @IsNotEmpty({ message: 'Confirm password is required' })
  rePassword?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Age must be a number' })
  @Min(13, { message: 'Minimum age is 13' })
  @Max(100, { message: 'Maximum age is 100' })
  age?: number;

  @IsOptional()
  @IsDateString({}, { message: 'DOB must be a valid date' })
  DOB?: string;

  @IsOptional()
  @IsEnum(GenderEnum, {
    message: 'Gender must be either MALE or FEMALE',
  })
  gender?: GenderEnum;

  @IsOptional()
  @IsEmail({}, { message: 'Recovery email must be a valid email address' })
  recoveryEmail?: string;

  @IsOptional()
  @IsEnum(ProviderEnum, {
    message: 'Provider must be either SYSTEM or GOOGLE',
  })
  provider?: ProviderEnum;
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class ConfirmEmailDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'OTP must be a string' })
  @IsNotEmpty({ message: 'OTP is required' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp!: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

export class VerifyResetCodeDto {
  @IsString({ message: 'Reset code must be a string' })
  @IsNotEmpty({ message: 'Reset code is required' })
  @Length(6, 6, { message: 'Reset code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Reset code must contain only digits' })
  resetCode!: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword!: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}
