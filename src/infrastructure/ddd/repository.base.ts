export class Paginated<T> {
  readonly count: number;
  readonly limit: number;
  readonly data: readonly T[];

  constructor(props: Paginated<T>) {
    this.count = props.count;
    this.limit = props.limit;
    this.data = props.data;
  }
}

export type OrderBy = { field: string; direction: 'asc' | 'desc' };

export type PaginatedQueryParams = {
  limit: number;
  offset: number;
  orderBy: OrderBy;
};
