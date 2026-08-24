import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../DB/Models/user.model';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async updateProfilePicture(userId: string, filePath: string) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const user = await this.userModel.findById(userId);
    if (!user) {
      this.deleteFile(normalizedPath);
      throw new NotFoundException('User not found');
    }
    if (user.profilePicture) {
      this.deleteFile(user.profilePicture);
    }
    user.profilePicture = normalizedPath;
    await user.save();
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.confirmEmailOTP;
    delete userObject.forgotPasswordOTP;
    return userObject;
  }

  private deleteFile(filePath: string) {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.error(`Failed to delete file at ${filePath}:`, error);
    }
  }
}
