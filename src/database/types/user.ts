import { FindOptionDto } from './find-option';

export type UserDto = {
  id: string;
  created: Date;
};

export type CreateUserDto = Omit<UserDto, 'created'>;

export type UpdateUserDto = Partial<Omit<CreateUserDto, 'id'>>;

export type FindUserDto = FindOptionDto & Partial<UserDto>;
