import type { Query } from 'mongoose';
import { paginationFunction } from './pagination.js';

const ALLOWED_SORT_FIELDS = new Set([
  'price', 'priceAfterDiscount', 'createdAt', 'updatedAt', 'totalRates', 'stock', 'title',
]);

const ALLOWED_FILTER_OPERATORS = new Set(['gt', 'gte', 'lt', 'lte', 'in', 'nin', 'eq', 'ne']);

const RESERVED_KEYS = new Set(['sort', 'select', 'page', 'size', 'search']);

export class ApiFeature<T> {
  public mongooseQuery: Query<T[], T>;
  private queryData: Record<string, string>;

  constructor(mongooseQuery: Query<T[], T>, queryData: Record<string, string>) {
    this.mongooseQuery = mongooseQuery;
    this.queryData = queryData;
  }

  pagination(): this {
    const { limit, skip, page } = paginationFunction({
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
    const filterObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this.queryData)) {
      if (!RESERVED_KEYS.has(key)) {
        filterObject[key] = value;
      }
    }
    // Replace operator strings with MongoDB $ operators (only whitelisted ones)
    const filterString = JSON.parse(
      JSON.stringify(filterObject).replace(
        new RegExp(`\\b(${[...ALLOWED_FILTER_OPERATORS].join('|')})\\b`, 'g'),
        (match) => `$${match}`,
      ),
    ) as Record<string, unknown>;
    this.mongooseQuery = this.mongooseQuery.find(filterString) as typeof this.mongooseQuery;
    return this;
  }

  search(fields: string[]): this {
    if (this.queryData.search) {
      const regex = { $regex: this.queryData.search, $options: 'i' };
      this.mongooseQuery = this.mongooseQuery.find({
        $or: fields.map((f) => ({ [f]: regex })),
      } as Parameters<typeof this.mongooseQuery.find>[0]) as typeof this.mongooseQuery;
    }
    return this;
  }
}
