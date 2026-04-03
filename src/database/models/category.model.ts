import mongoose, { Schema, model, type Model, type HydratedDocument, type Types } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  image?: { secure_url: string; public_id: string };
  customId: string;
  createdBy?: Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
}

export type ICategoryDocument = HydratedDocument<ICategory>;

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: {
      secure_url: String,
      public_id: String,
    },
    customId: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ isDeleted: 1 });

categorySchema.virtual('subCategories', {
  ref: 'SubCategory',
  foreignField: 'categoryId',
  localField: '_id',
});

categorySchema.virtual('products', {
  ref: 'Product',
  foreignField: 'categoryId',
  localField: '_id',
});

categorySchema.pre(/^find/, function (this: mongoose.Query<unknown, unknown>) {
  this.where({ isDeleted: { $ne: true } });
});

export const categoryModel: Model<ICategory> =
  (mongoose.models.Category as Model<ICategory>) ?? model<ICategory>('Category', categorySchema);
