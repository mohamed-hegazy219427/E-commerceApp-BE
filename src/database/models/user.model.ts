import mongoose, { Schema, model, type Model, type HydratedDocument } from 'mongoose';
import { hashSync } from 'bcrypt';
import { env } from '../../src/config/env.js';
import { systemRoles, type SystemRole } from '../../src/shared/utils/systemRoles.js';

export interface IAddress {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface IUser {
  userName: string;
  email: string;
  password: string;
  isConfirmed: boolean;
  role: SystemRole;
  phoneNumber: string;
  address: IAddress[];
  profilePicture?: { secure_url: string; public_id: string };
  status: 'Online' | 'Offline';
  isDeleted: boolean;
  deletedAt?: Date;
  gender: 'male' | 'female' | 'not_specified';
  age?: number;
  forgetCode?: string;
  provider: 'google' | 'system';
}

export type IUserDocument = HydratedDocument<IUser>;

const addressSchema = new Schema<IAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    isConfirmed: { type: Boolean, required: true, default: false },
    role: {
      type: String,
      default: systemRoles.USER,
      enum: Object.values(systemRoles),
    },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^[+]?[\d\s\-()]{7,15}$/, 'Invalid phone number format'],
    },
    address: [addressSchema],
    profilePicture: {
      secure_url: String,
      public_id: String,
    },
    status: { type: String, default: 'Offline', enum: ['Online', 'Offline'] },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    gender: {
      type: String,
      default: 'not_specified',
      enum: ['male', 'female', 'not_specified'],
    },
    age: { type: Number, min: 1, max: 120 },
    forgetCode: String,
    provider: { type: String, default: 'system', enum: ['google', 'system'] },
  },
  { timestamps: true },
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isDeleted: 1 });
userSchema.index({ isDeleted: 1 });

// Soft-delete filter
userSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

// Hash password before save
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    this.password = hashSync(this.password, env.SALT_ROUNDS);
  }
  next();
});

export const userModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? model<IUser>('User', userSchema);
