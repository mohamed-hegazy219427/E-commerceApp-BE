import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface IRefreshToken {
  token: string;
  userId: Types.ObjectId;
  expiresAt: Date;
  isRevoked: boolean;
}

export type IRefreshTokenDocument = HydratedDocument<IRefreshToken>;

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// TTL index — MongoDB auto-deletes expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });

export const refreshTokenModel: Model<IRefreshToken> =
  (mongoose.models.RefreshToken as Model<IRefreshToken>) ??
  model<IRefreshToken>('RefreshToken', refreshTokenSchema);
