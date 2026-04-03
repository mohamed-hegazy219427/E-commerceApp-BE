import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface ICartProduct {
  productId: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  userId: Types.ObjectId;
  products: ICartProduct[];
  subTotal: number;
  isDeleted: boolean;
}

export type ICartDocument = HydratedDocument<ICart>;

const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    subTotal: { type: Number, required: true, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 }, { unique: true });

export const cartModel: Model<ICart> =
  (mongoose.models.Cart as Model<ICart>) ?? model<ICart>('Cart', cartSchema);
