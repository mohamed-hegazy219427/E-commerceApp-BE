import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface IProductImage {
  secure_url: string;
  public_id: string;
}

export interface IProduct {
  title: string;
  desc?: string;
  slug: string;
  colors?: string[];
  sizes?: string[];
  price: number;
  appliedDiscount: number;
  priceAfterDiscount: number;
  stock: number;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId: Types.ObjectId;
  brandId: Types.ObjectId;
  images: IProductImage[];
  customId: string;
  totalRates: number;
  ratingsCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
}

export type IProductDocument = HydratedDocument<IProduct>;

const productSchema = new Schema<IProduct>(
  {
    title: { type: String, required: true, lowercase: true, trim: true },
    desc: String,
    slug: { type: String, required: true, lowercase: true, unique: true },
    colors: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 },
    appliedDiscount: { type: Number, default: 0, min: 0, max: 100 },
    priceAfterDiscount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 1, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategoryId: { type: Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    images: [
      {
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    customId: { type: String, required: true },
    totalRates: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// Indexes
productSchema.index({ categoryId: 1, subCategoryId: 1, brandId: 1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ price: 1, stock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ isDeleted: 1 });

productSchema.virtual('Reviews', {
  ref: 'Review',
  foreignField: 'productId',
  localField: '_id',
});

productSchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

export const productModel: Model<IProduct> =
  (mongoose.models.Product as Model<IProduct>) ?? model<IProduct>('Product', productSchema);
