import type {
  Document,
  Model,
  FilterQuery,
  UpdateQuery,
  ClientSession,
  QueryOptions,
  ProjectionType,
} from 'mongoose';

//   Base Repository   ──
// A thin, generic CRUD layer over Mongoose models.
// Extend per domain to add query methods specific to that aggregate.
//
// Example:
//   class UserRepository extends BaseRepository<IUserDocument> {
//     findByEmail(email: string) { return this.findOne({ email }); }
//   }
//

export class BaseRepository<TDocument extends Document> {
  constructor(public readonly model: Model<TDocument>) {}

  findById(id: string, options?: QueryOptions<TDocument>): Promise<TDocument | null> {
    return this.model.findById(id, null, options).exec();
  }

  findOne(
    filter: FilterQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findOne(filter, null, options).exec();
  }

  find(
    filter: FilterQuery<TDocument> = {},
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument[]> {
    return this.model.find(filter, null, options).exec();
  }

  /** Returns plain JS objects — skips Mongoose Document overhead on read-only queries. */
  findWithLean<TResult = Record<string, unknown>>(
    filter: FilterQuery<TDocument> = {},
    projection?: ProjectionType<TDocument>,
  ): Promise<TResult[]> {
    return this.model.find(filter, projection).lean<TResult[]>().exec();
  }

  async create<TInput extends object>(data: TInput, session?: ClientSession): Promise<TDocument> {
    const docs = await this.model.create([data], session ? { session } : undefined);
    return docs[0];
  }

  updateById(
    id: string,
    update: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
  }

  /** Filter-based updateOne — more efficient than findByIdAndUpdate when you don't need the doc. */
  updateOneFilter(
    filter: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<{ modifiedCount: number }> {
    return this.model.updateOne(filter, update).exec() as Promise<{ modifiedCount: number }>;
  }

  deleteById(id: string): Promise<TDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /** Logical soft-delete — sets isDeleted=true, deletedAt=now. Requires model to have those fields. */
  softDeleteById(id: string): Promise<TDocument | null> {
    return this.model
      .findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true })
      .exec();
  }

  async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    return (await this.model.exists(filter)) !== null;
  }

  countDocuments(filter: FilterQuery<TDocument> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec() 
  }
}
