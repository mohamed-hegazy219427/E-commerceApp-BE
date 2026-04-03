import type { Types } from 'mongoose';
import { BaseRepository } from '@repository/BaseRepository.js';
import { userModel } from '@models/user.model.js';
import { refreshTokenModel } from '@models/refreshToken.model.js';
import type { IUserDocument } from '@models/user.model.js';
import type { IRefreshTokenDocument, IRefreshToken } from '@models/refreshToken.model.js';

// ── User Repository ─────────────────────────────────────────────────────────

export class UserRepository extends BaseRepository<IUserDocument> {
  constructor() {
    super(userModel);
  }

  findByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email });
  }

  /** Finds a confirmed, non-deleted user by email (used for login). */
  findConfirmedByEmail(email: string): Promise<IUserDocument | null> {
    return this.findOne({ email, isConfirmed: true });
  }
}

// ── RefreshToken Repository ──────────────────────────────────────────────────

export class RefreshTokenRepository extends BaseRepository<IRefreshTokenDocument> {
  constructor() {
    super(refreshTokenModel);
  }

  findActiveToken(token: string): Promise<IRefreshTokenDocument | null> {
    return this.findOne({ token, isRevoked: false });
  }

  revokeToken(token: string): Promise<{ modifiedCount: number }> {
    return this.updateOneFilter({ token }, { isRevoked: true });
  }

  createToken(data: {
    token: string;
    userId: Types.ObjectId;
    expiresAt: Date;
  }): Promise<IRefreshTokenDocument> {
    return this.create(data as Partial<IRefreshToken>);
  }
}

export const userRepository = new UserRepository();
export const refreshTokenRepository = new RefreshTokenRepository();
