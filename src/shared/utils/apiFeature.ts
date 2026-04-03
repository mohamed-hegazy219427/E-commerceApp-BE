import type { Document, Query, FilterQuery } from 'mongoose';
import { paginationFunction } from './pagination.js';

const ALLOWED_SORT_FIELDS = new Set([
  'price',
  'priceAfterDiscount',
  'createdAt',
  'updatedAt',
  'totalRates',
  'stock',
  'title',
]);

const ALLOWED_FILTER_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte', 'in', 'nin', 'eq', 'ne']);

const RESERVED_KEYS = new Set(['sort', 'select', 'page', 'size', 'search']);

//   ApiFeature     ─
// Fluent query builder wrapping a Mongoose query.
// T extends Document enforces only Mongoose model types.
// Each method returns `this` so chaining is fully typed.
//
// Usage:
//   const feature = new ApiFeature(productModel.find(), req.query)
//     .filters()
//     .search(['title', 'desc'])  // type-safe field names
//     .sort()
//     .select()
//     .pagination()
//   const data = await feature.mongooseQuery
//
export class ApiFeature<T extends Document> {
  public mongooseQuery: Query<T[], T>;
  private queryData: Record<string, string>;

  constructor(mongooseQuery: Query<T[], T>, queryData: Record<string, string>) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  pagination(): this {
    const { limit, skip } = paginationFunction({
      page: parseInt(this.queryData.page ?? '1'),
      size: parseInt(this.queryData.size ?? '10'),
    });
    this.mongooseQuery = this.mongooseQuery.limit(limit).skip(skip) as typeof this.mongooseQuery;
    return this;
  }

  sort(): this {
    if (this.queryData.sort) {
      const sortFields = this.queryData.sort
        .split(',')
        .map((f) => f.trim())
        .filter((f) => {
          const clean = f.startsWith('-') ? f.slice(1) : f;
          return ALLOWED_SORT_FIELDS.has(clean);
        })
        .join(' ');
      if (sortFields) {
        this.mongooseQuery = this.mongooseQuery.sort(sortFields) as typeof this.mongooseQuery;
      }
    } else {
      this.mongooseQuery = this.mongooseQuery.sort('-createdAt') as typeof this.mongooseQuery;
    }
    return this;
  }

  select(): this {
    if (this.queryData.select) {
      const fields = this.queryData.select.replaceAll(',', ' ');
      this.mongooseQuery = this.mongooseQuery.select(fields) as typeof this.mongooseQuery;
    }
    return this;
  }

  filters(): this {
    const filterObject: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.queryData)) {
      if (!RESERVED_KEYS.has(key)) {
        filterObject[key] = value;
      }
    }
    const filterString = JSON.parse(
      JSON.stringify(filterObject).replace(
        new RegExp(`\\b(${[...ALLOWED_FILTER_OPERATORS].join('|')})\\b`, 'g'),
        (match) => `$${match}`,
      ),
    ) as FilterQuery<T>;
    this.mongooseQuery = this.mongooseQuery.find(filterString) as typeof this.mongooseQuery;
    return this;
  }

  // field names are constrained to keys of T that are strings
  search(fields: (keyof T & string)[]): this {
    if (this.queryData.search) {
      const regex = { $regex: this.queryData.search, $options: 'i' };
      this.mongooseQuery = this.mongooseQuery.find({
        $or: fields.map((f) => ({ [f]: regex })),
      } as Parameters<typeof this.mongooseQuery.find>[0]) as typeof this.mongooseQuery;
    }
    return this;
  }

  /** Skips Mongoose document features for better performance on read-only queries. */
  lean(): this {
    this.mongooseQuery = this.mongooseQuery.lean() as unknown as typeof this.mongooseQuery;
    return this;
  }

  /** Execute and return matching documents. */
  execute(): Promise<T[]> {
    return this.mongooseQuery.exec();
  }
}
