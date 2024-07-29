import { FindOptionDto } from './find-option';

export type GuildDto = {
  id: string;
  created: Date;
};

export type CreateGuildDto = Omit<GuildDto, 'created'>;

export type UpdateGuildDto = Partial<Omit<CreateGuildDto, 'id'>>;

export type FindGuildDto = FindOptionDto & Partial<GuildDto>;
