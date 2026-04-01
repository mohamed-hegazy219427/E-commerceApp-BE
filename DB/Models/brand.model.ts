import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface IBrand {
  name: string;
  slug: string;
  logo: { secure_url: string; public_id: string };
  customId: string;
  addBy: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

export type IBrandDocument = HydratedDocument<IBrand>;

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    logo: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    customId: { type: String, required: true },
    addBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

brandSchema.index({ name: 1 }, { unique: true });
brandSchema.index({ isDeleted: 1 });

brandSchema.virtual('products', {
  ref: 'Product',
  foreignField: 'brandId',
  localField: '_id',
});

brandSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

export const brandModel: Model<IBrand> =
  (mongoose.models.Brand as Model<IBrand>) ?? model<IBrand>('Brand', brandSchema);
