import {
  BadRequestException,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import {
  ConfirmEmailDto,
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
  ResendVerificationDto,
} from './auth.dtos';
import { User, UserDocument } from 'src/DB/Models/user.model';
import { compareHash, hash } from 'src/common/security/hash.security';
import { ProviderEnum } from 'src/common/enums';
import { EmailService } from 'src/common/email/email.service';
import { generateOTP } from 'src/common/utils';
import { RedisService } from 'src/common/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    @Optional() private readonly redisService?: RedisService,
  ) {}


  async signup(createUserDto: CreateUserDto) {
    const { rePassword, ...rest } = createUserDto;

    if (rest.password && rePassword && rest.password !== rePassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const userExists = await this.userModel.findOne({
      email: rest.email.toLowerCase().trim(),
    });
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = rest.password
      ? await hash(rest.password)
      : undefined;

    const otp = generateOTP();
    const hashedOtp = await hash(otp);
    const otpExpirationMinutes = Number(
      this.configService.get<number>('OTP_EXPIRATION_MINUTES') ?? 10,
    );
    const otpExpires = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

    const user = await this.userModel.create({
      ...rest,
      password: hashedPassword,
      confirmEmailOTP: hashedOtp,
      confirmEmailOTPExpires: otpExpires,
    });

    // Verification is informational: the account is usable immediately, and the
    // email only flips `isVerified`. A mail failure must not fail the signup.
    try {
      await this.emailService.sendConfirmationEmail(user.email, user.name, otp);
    } catch (err) {
      this.logger.warn(
        `Could not send verification email to ${user.email}: ${(err as Error).message}`,
      );
    }

    const { accessToken, refreshToken } = this.issueTokens(user);
    return { user: user.toObject(), accessToken, refreshToken };
  }

  /** Signs the access/refresh pair for a user document. */
  private issueTokens(user: UserDocument) {
    const payload = { id: user._id, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRATION') ?? '1h') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ??
        this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d') as any,
    });

    return { accessToken, refreshToken };
  }
  async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
    const { email, otp } = confirmEmailDto;

    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already confirmed');
    }

    if (!user.confirmEmailOTP || !user.confirmEmailOTPExpires) {
      throw new BadRequestException('No OTP found, please request a new one');
    }

    if (user.confirmEmailOTPExpires < new Date()) {
      throw new BadRequestException('OTP has expired, please request a new one');
    }

    const isOtpValid = await compareHash(otp, user.confirmEmailOTP);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.userModel.findByIdAndUpdate(user._id, {
      isVerified: true,
      confirmedAt: new Date(),
      $unset: {
        confirmEmailOTP: 1,
        confirmEmailOTPExpires: 1,
      },
    });

    return user.toObject();
  }
  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({
      email: loginDto.email.toLowerCase().trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.provider !== ProviderEnum.SYSTEM) {
      throw new UnauthorizedException('Please sign in with Google');
    }

    const isPasswordValid = await compareHash(
      loginDto.password,
      user.password!,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.issueTokens(user);
    return { user: user.toObject(), accessToken, refreshToken };
  }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.provider !== ProviderEnum.SYSTEM) {
      throw new BadRequestException('Cannot reset password for OAuth accounts');
    }

    const otp = generateOTP();
    const hashedOtp = await hash(otp);

    const otpExpirationMinutes = Number(
      this.configService.get<number>('OTP_EXPIRATION_MINUTES') ?? 10,
    );
    const otpExpires = new Date(Date.now() + otpExpirationMinutes * 60 * 1000);

    user.forgotPasswordOTP = hashedOtp;
    user.forgotPasswordOTPExpires = otpExpires;
    user.resetCodeVerified = false;
    await user.save();

    await this.emailService.sendForgotPasswordEmail(
      user.email,
      `${user.name}`,
      otp,
    );

    return { message: 'Password reset OTP sent to email' };
  }
  /**
   * Step 2 of the reset flow. The frontend posts only the code, so the user is
   * located by matching the code against every account with a live reset OTP.
   * Verifying marks the account, which step 3 then requires.
   */
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const { resetCode } = verifyResetCodeDto;

    const candidates = await this.userModel.find({
      forgotPasswordOTP: { $exists: true },
      forgotPasswordOTPExpires: { $gt: new Date() },
    });

    for (const candidate of candidates) {
      if (await compareHash(resetCode, candidate.forgotPasswordOTP!)) {
        await this.userModel.findByIdAndUpdate(candidate._id, {
          resetCodeVerified: true,
        });
        return { status: 'Success' };
      }
    }

    throw new BadRequestException('Invalid or expired reset code');
  }

  /**
   * Step 3. The frontend sends no code here, so the reset is only permitted
   * when step 2 already verified this account's still-live OTP.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, newPassword } = resetPasswordDto;

    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.forgotPasswordOTP || !user.forgotPasswordOTPExpires) {
      throw new BadRequestException('No password reset requested');
    }

    if (user.forgotPasswordOTPExpires < new Date()) {
      throw new BadRequestException('Reset code has expired, please request a new one');
    }

    if (!user.resetCodeVerified) {
      throw new BadRequestException('Please verify your reset code first');
    }

    const hashedPassword = await hash(newPassword);

    await this.userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      changeCredentialsTime: new Date(),
      resetCodeVerified: false,
      $unset: {
        forgotPasswordOTP: 1,
        forgotPasswordOTPExpires: 1,
      },
    });

    await this.redisService?.del(`user:credentials:${user._id.toString()}`);

    return { message: 'Password reset successfully' };
  }

  /** Re-sends the verification email for an account that is not yet verified. */
  async resendVerification(dto: ResendVerificationDto) {
    const user = await this.userModel.findOne({
      email: dto.email.toLowerCase().trim(),
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = generateOTP();
    const otpExpirationMinutes = Number(
      this.configService.get<number>('OTP_EXPIRATION_MINUTES') ?? 10,
    );

    user.confirmEmailOTP = await hash(otp);
    user.confirmEmailOTPExpires = new Date(
      Date.now() + otpExpirationMinutes * 60 * 1000,
    );
    user.confirmEmailOTPResendCount += 1;
    await user.save();

    await this.emailService.sendConfirmationEmail(user.email, user.name, otp);

    return { message: 'Verification email sent' };
  }

  async logout(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.userModel.findByIdAndUpdate(userId, {
      changeCredentialsTime: new Date(),
    });

    if (this.redisService) {
      try {
        await this.redisService.del(`user:credentials:${userId}`);
      } catch {
      }
    }

    return { message: 'Logged out successfully' };
  }
}


