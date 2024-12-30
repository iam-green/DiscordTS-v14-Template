import { example } from '../schema';
import { FindOptionDto } from './find-option';

export type ExampleDto = typeof example.$inferSelect;

export type CreateExampleDto = Omit<ExampleDto, 'id' | 'created'>;

export type UpdateExampleDto = Partial<CreateExampleDto>;

export type FindExampleDto = FindOptionDto & Partial<ExampleDto>;
