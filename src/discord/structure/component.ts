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
import {
  ButtonBuilder,
  ComponentType as DiscordComponentType,
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

export class ExtendedComponent<Type extends SupportComponentType> {
  type: ComponentType<Type>['type'];
  id: ComponentType<Type>['id'];
  component: ComponentType<Type>['component'];
  options: ComponentType<Type>['options'];
  run: ComponentType<Type>['run'];
  data: any;

  static list: {
    component: ComponentType<SupportComponentType>;
    custom_id: string;
    expire?: number;
  }[] = [];

  constructor(componentOptions: ComponentType<Type>) {
    Object.assign(this, componentOptions);
  }

  generate() {
    let uuid = randomUUID();
    while (ExtendedComponent.list.some((c) => c.custom_id.endsWith(uuid)))
      uuid = randomUUID();
    const id = `${this.id}_${uuid}`;
    const component = (
      this.type in ComponentBuilderMap
        ? this.component instanceof Function
          ? this.component(
              new ComponentBuilderMap[this.type]({ custom_id: id }),
            )
          : this.component
        : undefined
    ) as Type extends keyof ComponentGenerateTypeMap
      ? ComponentGenerateTypeMap[Type]
      : undefined;
    if (component)
      ExtendedComponent.list.push({
        component: this,
        custom_id: id,
        expire: this.options?.expire
          ? Date.now() + this.options.expire
          : undefined,
      });
    return component;
  }

  static removeExpired() {
    ExtendedComponent.list = ExtendedComponent.list.filter(
      (c) => (c?.expire ?? Infinity) > Date.now(),
    );
  }
}
