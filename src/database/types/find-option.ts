export type FindOptionDto = {
  sort?: 'asc' | 'desc';
  page?: number;
  count?: number;
  from?: Date;
  to?: Date;
};

export const defaultFindOption = (): Required<FindOptionDto> => ({
  sort: 'asc',
  page: 1,
  count: 10,
  from: new Date(0),
  to: new Date(),
});
