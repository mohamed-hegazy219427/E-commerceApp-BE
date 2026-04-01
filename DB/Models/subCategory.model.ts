import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface ISubCategory {
  name: string;
  slug: string;
  image: { secure_url: string; public_id: string };
  customId: string;
  createdBy: Types.ObjectId;
  categoryId: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

export type ISubCategoryDocument = HydratedDocument<ISubCategory>;

const subCategorySchema = new Schema<ISubCategory>(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    customId: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

subCategorySchema.index({ name: 1 }, { unique: true });
subCategorySchema.index({ categoryId: 1, isDeleted: 1 });

subCategorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'subCategoryId',
  localField: '_id',
});

subCategorySchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

export const subCategoryModel: Model<ISubCategory> =
  (mongoose.models.SubCategory as Model<ISubCategory>) ??
  model<ISubCategory>('SubCategory', subCategorySchema);
