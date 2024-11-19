import { FindOptionDto } from './find-option';

export type ExampleDto = {
  id: string;
  created: Date;
};

export type CreateExampleDto = Omit<ExampleDto, 'id' | 'created'>;

export type UpdateExampleDto = Partial<CreateExampleDto>;

export type FindExampleDto = FindOptionDto & Partial<ExampleDto>;
