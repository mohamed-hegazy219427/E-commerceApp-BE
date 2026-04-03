export { default as router } from './auth.routes.js';
export type {
  SignUpBodyDTO,
  LoginBodyDTO,
  ConfirmEmailParamsDTO,
  ForgetPasswordBodyDTO,
  ResetPasswordBodyDTO,
  ResetPasswordParamsDTO,
  LoginWithGoogleBodyDTO,
} from './auth.validationSchemas.js';
export type { IUser, IUserDocument } from './auth.types.js';
