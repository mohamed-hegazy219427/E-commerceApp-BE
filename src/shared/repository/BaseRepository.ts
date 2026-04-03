import type {
  Document,
  Model,
  FilterQuery,
  UpdateQuery,
  ClientSession,
  QueryOptions,
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
  constructor(protected readonly model: Model<TDocument>) {}

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

  deleteById(id: string): Promise<TDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async exists(filter: FilterQuery<TDocument>): Promise<boolean> {
    return (await this.model.exists(filter)) !== null;
  }

  countDocuments(filter: FilterQuery<TDocument> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec() as Promise<number>;
  }
}
