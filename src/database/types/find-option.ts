export type FindOptionDto = Partial<{
  sort: 'asc' | 'desc';
  page: number;
  limit: number;
  from: Date;
  to: Date;
}>;

export const defaultFindOption = (): Required<FindOptionDto> => ({
  sort: 'asc',
  page: 1,
  limit: 10,
  from: new Date(0),
  to: new Date(),
});
