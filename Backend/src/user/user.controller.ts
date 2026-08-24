import {
  BadRequestException,
  Controller,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { AuthGuard } from '../common/guard/auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { multerOptions } from '../common/utils/multer.utils';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('profile-picture')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async updateProfilePicture(
    @CurrentUser('id') userId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    const updatedUser = await this.userService.updateProfilePicture(
      userId,
      file.path,
    );

    return {
      success: true,
      message: 'Profile picture updated successfully',
      profilePicture: updatedUser.profilePicture,
      user: updatedUser,
    };
  }
}
