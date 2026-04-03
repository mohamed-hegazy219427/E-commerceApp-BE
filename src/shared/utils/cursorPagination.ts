import { type Model, type FilterQuery, Types } from 'mongoose';

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface CursorPayload {
  id: string;
  sortValue: unknown;
}

/**
 * Keyset-based pagination.
 * Encodes cursor as base64 JSON containing the ID and sort value.
 */
export async function cursorPaginate<T extends { _id: any; [key: string]: any }>(
  model: Model<any>,
  filter: FilterQuery<any>,
  limit: number,
  cursor?: string,
  sortField: string = 'createdAt',
): Promise<CursorPage<T>> {
  const queryFilter: FilterQuery<any> = { ...filter };

  if (cursor) {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8')) as CursorPayload;
      
      // (sortField < lastValue) OR (sortField == lastValue AND _id < lastId)
      // Assuming descending order for most common use case (news feed, latest products)
      queryFilter.$or = [
        { [sortField]: { $lt: decoded.sortValue } },
        {
          [sortField]: decoded.sortValue,
          _id: { $lt: new Types.ObjectId(decoded.id) },
        },
      ];
    } catch (e) {
      // If cursor is invalid, we ignore it and start from beginning
    }
  }

  const results = await model
    .find(queryFilter)
    .sort({ [sortField]: -1, _id: -1 })
    .limit(limit + 1)
    .lean<T[]>()
    .exec();

  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  
  let nextCursor: string | null = null;
  if (hasMore) {
    const lastItem = data[data.length - 1];
    const payload: CursorPayload = {
      id: String(lastItem._id),
      sortValue: lastItem[sortField],
    };
    nextCursor = Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  return { data, nextCursor, hasMore };
}
