import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export type OrderStatus =
  | 'confirmed'
  | 'placed'
  | 'on_way'
  | 'rejected'
  | 'pending'
  | 'delivered'
  | 'canceled';

export type PaymentMethod = 'cash' | 'card';

export interface IOrderProduct {
  productId: Types.ObjectId;
  quantity: number;
  title: string;
  price: number;
  finalPrice: number;
}

export interface IOrderAddress {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface IOrder {
  userId: Types.ObjectId;
  products: IOrderProduct[];
  subTotal: number;
  couponId?: Types.ObjectId;
  paidAmount: number;
  address: IOrderAddress;
  phoneNumbers: string[];
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  updatedBy?: Types.ObjectId;
  canceledBy?: Types.ObjectId;
  reason?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

export type IOrderDocument = HydratedDocument<IOrder>;

const orderAddressSchema = new Schema<IOrderAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    postalCode: String,
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, default: 1, min: 1 },
        title: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        finalPrice: { type: Number, required: true, min: 0 },
      },
    ],
    subTotal: { type: Number, required: true, default: 0, min: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    address: { type: orderAddressSchema, required: true },
    phoneNumbers: [{ type: String, required: true }],
    orderStatus: {
      type: String,
      enum: ['confirmed', 'placed', 'on_way', 'rejected', 'pending', 'delivered', 'canceled'],
    },
    paymentMethod: { type: String, required: true, enum: ['cash', 'card'] },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    canceledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ userId: 1, orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isDeleted: 1 });

export const orderModel: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) ?? model<IOrder>('Order', orderSchema);
