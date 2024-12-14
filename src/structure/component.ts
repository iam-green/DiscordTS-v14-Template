import {
  APIButtonComponent,
  APIChannelSelectComponent,
  APIMentionableSelectComponent,
  APIRoleSelectComponent,
  APIStringSelectComponent,
  APITextInputComponent,
  APIUserSelectComponent,
  ButtonInteraction,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  ButtonBuilder,
  ComponentType as DiscordComponentType,
  MentionableSelectMenuBuilder,
  MentionableSelectMenuInteraction,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from 'discord.js';
import { randomUUID } from 'crypto';
import { ExtendedClient } from './client';

export type SupportComponentType =
  | DiscordComponentType.Button
  | DiscordComponentType.StringSelect
  | DiscordComponentType.TextInput
  | DiscordComponentType.UserSelect
  | DiscordComponentType.RoleSelect
  | DiscordComponentType.MentionableSelect
  | DiscordComponentType.ChannelSelect;

export type ComponentComponentTypeMap = {
  [DiscordComponentType.Button]:
    | Omit<APIButtonComponent, 'custom_id'>
    | ((option: ButtonBuilder) => ButtonBuilder);
  [DiscordComponentType.StringSelect]:
    | Omit<APIStringSelectComponent, 'custom_id'>
    | ((option: StringSelectMenuBuilder) => StringSelectMenuBuilder);
  [DiscordComponentType.TextInput]:
    | Omit<APITextInputComponent, 'custom_id'>
    | ((option: TextInputBuilder) => TextInputBuilder);
  [DiscordComponentType.UserSelect]:
    | Omit<APIUserSelectComponent, 'custom_id'>
    | ((option: UserSelectMenuBuilder) => UserSelectMenuBuilder);
  [DiscordComponentType.RoleSelect]:
    | Omit<APIRoleSelectComponent, 'custom_id'>
    | ((option: RoleSelectMenuBuilder) => RoleSelectMenuBuilder);
  [DiscordComponentType.MentionableSelect]:
    | Omit<APIMentionableSelectComponent, 'custom_id'>
    | ((option: MentionableSelectMenuBuilder) => MentionableSelectMenuBuilder);
  [DiscordComponentType.ChannelSelect]:
    | Omit<APIChannelSelectComponent, 'custom_id'>
    | ((option: ChannelSelectMenuBuilder) => ChannelSelectMenuBuilder);
};

export type ComponentGenerateTypeMap = {
  [DiscordComponentType.Button]: ButtonBuilder;
  [DiscordComponentType.StringSelect]: StringSelectMenuBuilder;
  [DiscordComponentType.TextInput]: TextInputBuilder;
  [DiscordComponentType.UserSelect]: UserSelectMenuBuilder;
  [DiscordComponentType.RoleSelect]: RoleSelectMenuBuilder;
  [DiscordComponentType.MentionableSelect]: MentionableSelectMenuBuilder;
  [DiscordComponentType.ChannelSelect]: ChannelSelectMenuBuilder;
};

export type ComponentRunInteractionTypeMap = {
  [DiscordComponentType.Button]: ButtonInteraction;
  [DiscordComponentType.StringSelect]: StringSelectMenuInteraction;
  [DiscordComponentType.TextInput]: ModalSubmitInteraction;
  [DiscordComponentType.UserSelect]: UserSelectMenuInteraction;
  [DiscordComponentType.RoleSelect]: RoleSelectMenuInteraction;
  [DiscordComponentType.MentionableSelect]: MentionableSelectMenuInteraction;
  [DiscordComponentType.ChannelSelect]: ChannelSelectMenuInteraction;
};

export const ComponentBuilderMap: Record<
  SupportComponentType,
  new (option: any) => any
> = {
  [DiscordComponentType.Button]: ButtonBuilder,
  [DiscordComponentType.ChannelSelect]: ChannelSelectMenuBuilder,
  [DiscordComponentType.MentionableSelect]: MentionableSelectMenuBuilder,
  [DiscordComponentType.RoleSelect]: RoleSelectMenuBuilder,
  [DiscordComponentType.StringSelect]: StringSelectMenuBuilder,
  [DiscordComponentType.TextInput]: TextInputBuilder,
  [DiscordComponentType.UserSelect]: UserSelectMenuBuilder,
};

export type ComponentType<Type extends SupportComponentType> = {
  type: Type;
  id: string;
  component: Type extends keyof ComponentComponentTypeMap
    ? ComponentComponentTypeMap[Type]
    : never;
  once?: boolean;
  options?: Partial<{
    expire: number;
    guildId: string[];
    permission: Partial<{
      user: PermissionResolvable[];
      bot: PermissionResolvable[];
    }>;
    cooldown: number;
    onlyGuild: boolean;
    botAdmin: boolean;
    botDeveloper: boolean;
    guildOwner: boolean;
  }>;
  run: (options: {
    client: ExtendedClient;
    interaction: Type extends keyof ComponentComponentTypeMap
      ? ComponentRunInteractionTypeMap[Type]
      : never;
  }) => void;
};

export const ExtendedComponent = <Type extends SupportComponentType>(
  data: ComponentType<Type>,
) => {
  let uuid = randomUUID();
  while (ExtendedComponent.list.has(`${data.id}_${uuid}`)) uuid = randomUUID();
  const id = `${data.id}_${uuid}`;
  const component = (
    typeof data.component == 'function'
      ? data.component(new ComponentBuilderMap[data.type]({ custom_id: id }))
      : data.component
  ) as ComponentGenerateTypeMap[Type];
  if (component)
    ExtendedComponent.list.set(id, {
      component: data,
      expire: data.options?.expire
        ? Date.now() + data.options.expire
        : undefined,
    });
  return Object.assign(component, data);
};

ExtendedComponent.list = new Map<
  string,
  {
    component: ComponentType<SupportComponentType>;
    expire?: number;
  }
>();

ExtendedComponent.removeExpired = () => {
  for (const [id, { expire }] of ExtendedComponent.list)
    if (expire && expire < Date.now()) ExtendedComponent.list.delete(id);
};
