import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ConfirmEmailDto,
  CreateUserDto,
  ForgotPasswordDto,
  LoginDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './auth.dtos';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { UserDocument } from '../DB/Models/user.model';

/**
 * Route names and response shapes here are dictated by the frontend, which was
 * originally written against a third-party API.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** The public view of a user; this is what lands in the NextAuth session. */
  private toPublicUser(user: Partial<UserDocument> & Record<string, any>) {
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified ?? false,
      profilePicture: user.profilePicture,
    };
  }

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    const { user, accessToken, refreshToken } =
      await this.authService.signup(createUserDto);
    return {
      message: 'success',
      user: this.toPublicUser(user),
      token: accessToken,
      refreshToken,
    };
  }

  @Post('signin')
  async signin(@Body() loginDto: LoginDto) {
    const { user, accessToken, refreshToken } =
      await this.authService.login(loginDto);
    return {
      message: 'success',
      user: this.toPublicUser(user),
      token: accessToken,
      refreshToken,
    };
  }

  /** Kept as an alias so existing API clients and the Swagger docs still work. */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.signin(loginDto);
  }

  @Post('confirm-email')
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    const user = await this.authService.confirmEmail(confirmEmailDto);
    return {
      message: 'success',
      user: this.toPublicUser(user),
    };
  }

  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    const result = await this.authService.resendVerification(dto);
    return { status: 'success', ...result };
  }

  @Post('forgotPasswords')
  async forgotPasswords(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return { statusMsg: 'success', ...result };
  }

  @Post('verifyResetCode')
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyResetCodeDto);
  }

  @Put('resetPassword')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return { statusMsg: 'success', ...result };
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@CurrentUser('id') userId: string) {
    const result = await this.authService.logout(userId);
    return { status: 'success', ...result };
  }
}
