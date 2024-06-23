import { SelectQueryBuilder } from 'typeorm';

export interface PaginateOptions {
  limit: number;
  currentPage: number;
  total?: boolean;
}

export interface PaginateResult<T> {
  firt: number;
  last: number;
  limit: number;
  total?: number;
  data: T[];
}

export async function paginate<T>(
  qb: SelectQueryBuilder<T>,
  options: PaginateOptions = { limit: 10, currentPage: 1 },
): Promise<PaginateResult<T>> {
  const offset = (options.currentPage - 1) * options.limit;
  const data = await qb.offset(offset).limit(options.limit).getMany();

  return {
    firt: offset + 1,
    last: offset + data.length,
    limit: options.limit,
    total: options.total ? await qb.getCount() : null,
    data,
  };
}
