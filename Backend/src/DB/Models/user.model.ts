import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GenderEnum, ProviderEnum, RoleEnum } from '../../common/enums';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name!: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({
    required: function (this: UserDocument) {
      return this.provider === ProviderEnum.SYSTEM;
    },
  })
  password?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ min: 13, max: 100 })
  age?: number;

  @Prop()
  DOB?: Date;

  @Prop({
    type: String,
    enum: Object.values(GenderEnum),
    default: GenderEnum.MALE,
  })
  gender!: GenderEnum;

  @Prop()
  profilePicture?: string;

  @Prop({ lowercase: true, trim: true })
  recoveryEmail?: string;

  @Prop({
    type: String,
    enum: Object.values(RoleEnum),
    default: RoleEnum.USER,
  })
  role!: RoleEnum;

  @Prop({
    type: String,
    enum: Object.values(ProviderEnum),
    default: ProviderEnum.SYSTEM,
  })
  provider!: ProviderEnum;

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop()
  confirmedAt?: Date;

  @Prop()
  confirmEmailOTP?: string;

  @Prop()
  confirmEmailOTPExpires?: Date;

  @Prop({ default: 0 })
  confirmEmailOTPResendCount!: number;

  @Prop()
  forgotPasswordOTP?: string;

  @Prop()
  forgotPasswordOTPExpires?: Date;

  // Set by verifyResetCode; required by resetPassword, which carries no code.
  @Prop({ default: false })
  resetCodeVerified!: boolean;

  @Prop()
  restoreAccountOTP?: string;

  @Prop()
  restoreAccountOTPExpires?: Date;

  @Prop({
  type: Types.ObjectId,
  ref: User.name,
  })
  restoredBy?: Types.ObjectId;

  @Prop()
  restoredAt?: Date;

  @Prop()
  changeCredentialsTime?: Date;

  @Prop({
  type: Types.ObjectId,
  ref: User.name,
    })
  freezedBy?: Types.ObjectId;

  @Prop()
  freezedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
export const UserModel = MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]);

UserSchema.virtual('username')
  .get(function (this: UserDocument) {
    return this.name;
  })
  .set(function (this: UserDocument, value: string) {
    this.name = value;
  });
