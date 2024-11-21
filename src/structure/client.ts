import {
  ApplicationCommandType,
  BaseMessageOptions,
  ChannelType,
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  ComponentType,
  EmbedBuilder,
  Events,
  Interaction,
  InteractionReplyOptions,
  LocaleString,
  Message,
  PermissionFlagsBits,
  PermissionResolvable,
} from 'discord.js';
import { Log, TimeoutMessage } from '../module';
import { ClusterClient } from 'discord-hybrid-sharding';
import { CommandType, ExtendedApplicationCommand } from './application_command';
import { ExtendedEvent } from './event';
import { Language, LanguageData } from './language';
import { Discord as DiscordUtil } from '../module';
import { BotConfig, EmbedConfig } from '../config';
import chalk from 'chalk';
import { ExtendedTextCommand, TextCommandType } from './text_command';
import { ComponentRunInteractionTypeMap, ExtendedComponent } from './component';

export class ExtendedClient extends Client {
  static client: ExtendedClient;
  cluster = new ClusterClient(this);
  private cooldown: Map<string, Map<string, number>> = new Map();
  private prefix = `${chalk.cyan('[')}Cluster ${chalk.green(
    `#${this.cluster.id}`,
  )}${chalk.cyan(']')}`;
  locale: Map<string, LocaleString> = new Map();

  constructor(option: ClientOptions) {
    super(option);
    ExtendedClient.client = this;
  }

  async start() {
    await Language.init();
    await ExtendedEvent.init();
    await ExtendedTextCommand.init();
    await ExtendedApplicationCommand.init();
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(`${this.prefix} Logged in as ${chalk.green(this.user?.tag)}!`);
  }

  private async registerModules() {
    await this.addAutoComplete();
    await this.addCommands();
    await this.addTextCommands();
    await this.addEvents();
    await this.addComponents();
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
  }

  private async addAutoComplete() {
    const commands = ExtendedApplicationCommand.allCommands;
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isAutocomplete()) return;

      // Find Command
      const name = [
        interaction.commandName,
        interaction.options.getSubcommandGroup(false),
        interaction.options.getSubcommand(false),
      ]
        .filter((v) => v)
        .join(' ');
      const command = commands.get(name)?.command;
      if (!command) return;

      // Run AutoComplete
      command.autoComplete?.({
        client: this,
        interaction,
        args: interaction.options,
      });
    });
  }

  private async addCommands() {
    const commands = ExtendedApplicationCommand.allCommands;
    this.on(Events.InteractionCreate, async (interaction) => {
      if (
        !interaction.isChatInputCommand() &&
        !interaction.isContextMenuCommand()
      )
        return;

      const type = interaction.isChatInputCommand()
        ? ApplicationCommandType.ChatInput
        : interaction.isMessageContextMenuCommand()
          ? ApplicationCommandType.Message
          : ApplicationCommandType.User;

      // Add Locale
      if (
        !this.locale.has(interaction.user.id) ||
        this.locale.get(interaction.user.id) != interaction.locale
      )
        this.locale.set(interaction.user.id, interaction.locale);

      // Find Command
      const name = [
        interaction.commandName,
        interaction.isChatInputCommand()
          ? interaction.options.getSubcommandGroup(false)
          : undefined,
        interaction.isChatInputCommand()
          ? interaction.options.getSubcommand(false)
          : undefined,
      ]
        .filter((v) => v)
        .join(' ');
      let command: CommandType<ApplicationCommandType> | undefined = undefined;
      for (const {
        command: { type: type_, name: name_ },
      } of commands.values())
        if (type_ == type && name_ == name) {
          command = commands.get(name_)?.command;
          break;
        }
      if (!command) return;

      // Check Options
      const validate = await this.checkOptions(
        interaction,
        null,
        command.options,
      );
      if (validate) return await interaction.reply(validate).catch(() => {});

      // Run Command
      command.run({
        args:
          command.type == ApplicationCommandType.ChatInput
            ? (interaction.options as CommandInteractionOptionResolver)
            : undefined,
        client: this,
        interaction,
      });
    });
  }

  private async addComponents() {
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!('customId' in interaction)) return;
      const type = interaction.isButton()
        ? ComponentType.Button
        : interaction.isStringSelectMenu()
          ? ComponentType.StringSelect
          : interaction.isChannelSelectMenu()
            ? ComponentType.ChannelSelect
            : interaction.isRoleSelectMenu()
              ? ComponentType.RoleSelect
              : interaction.isMentionableSelectMenu()
                ? ComponentType.MentionableSelect
                : interaction.isUserSelectMenu()
                  ? ComponentType.UserSelect
                  : ComponentType.TextInput;

      // Remove Expired Component
      ExtendedComponent.removeExpired();

      // Find Generated Component
      let component: any = null;
      for (const [k, v] of ExtendedComponent.list)
        if (v.component.type == type && k == interaction.customId) {
          component = v;
          break;
        }
      if (!component) return;

      // Check Options
      const validate = await this.checkOptions(
        interaction,
        null,
        component.component.options,
      );
      if (validate) return await interaction.reply(validate).catch(() => {});

      // Set Component Expire
      if (component.component.options?.expire)
        component.expire = Date.now() + component.component.options.expire;

      // Run Component
      component.component.run({
        client: this,
        interaction: interaction as ComponentRunInteractionTypeMap[typeof type],
      });

      // Remove Once Component
      if (component.component.once)
        ExtendedComponent.list.delete(interaction.customId);
    });
  }

  private async addEvents() {
    for (const { event } of ExtendedEvent.list.values())
      this[event.once ? 'once' : 'on'](event.event, (...args) =>
        event.run(this, ...args),
      );
  }

  private async addTextCommands() {
    const commnads = ExtendedTextCommand.commands;
    this.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;

      // Check Prefix
      let prefix = '';
      for (const p of BotConfig.COMMAND_PREFIX.sort(
        (a, b) => b.length - a.length,
      ))
        if (message.content.trim().startsWith(p)) {
          prefix = p;
          break;
        }
      if (!prefix) return;

      // Find Text Command
      const content = message.content.slice(prefix.length).trim();
      let command: TextCommandType<boolean> | undefined = undefined;
      for (const { command: c } of commnads.values())
        for (const name of Array.isArray(c.name) ? c.name : [c.name])
          if (content.startsWith(name)) {
            command = c;
            break;
          }
      if (!command) return;

      // Check Send Message Permission
      if (
        message.guild?.members?.me &&
        message.channel.type != ChannelType.DM &&
        !message.channel
          ?.permissionsFor(message.guild.members.me)
          ?.has([
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
          ])
      )
        return;

      // Check Options
      const validate = await this.checkOptions(
        message,
        Array.isArray(command.name) ? command.name[0] : command.name,
        command.options,
      );
      if (validate) {
        const replied = await message.reply(validate).catch(() => {});
        if (replied) await TimeoutMessage.set(replied, 1000 * 5);
        return;
      }

      // Run Command
      command.run({
        client: this,
        locale:
          this.locale.get(message.author.id) ?? BotConfig.DEFAULT_LANGUAGE,
        message,
      });
    });
  }

  private async checkOptions<T extends Interaction | Message>(
    message: T,
    commandName: T extends Message ? string : null,
    options?: Partial<{
      permission: Partial<{
        user: PermissionResolvable[];
        bot: PermissionResolvable[];
      }>;
      cooldown: number;
      onlyGuild: boolean;
      botAdmin: boolean;
      botDeveloper: boolean;
      guildOwner: boolean;
    }>,
  ): Promise<
    | (T extends Interaction ? InteractionReplyOptions : BaseMessageOptions)
    | null
  > {
    const locale =
      'locale' in message
        ? message.locale
        : (this.locale.get(message.author.id) ?? BotConfig.DEFAULT_LANGUAGE);
    const user = 'user' in message ? message.user : message.author;
    const cooldownId =
      'commandId' in message ? message.commandId : commandName || '';

    // Check Guild Only
    if (options?.onlyGuild && !message.guild)
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle(
              Language.get(locale, 'Embed_Warn_OnlyCanUseInGuild_Title'),
            )
            .setDescription(
              Language.get(locale, 'Embed_Warn_OnlyCanUseInGuild_Description'),
            )
            .setColor(EmbedConfig.WARN_COLOR)
            .setFooter({
              text: user.tag,
              iconURL: user.avatarURL() || undefined,
            })
            .setTimestamp(),
        ],
        allowedMentions: { parse: [] },
        ...('locale' in message && { ephemeral: true }),
      };

    // Check Cooldown
    if (options?.cooldown) {
      const now = Date.now();
      if (!this.cooldown.has(user.id)) this.cooldown.set(user.id, new Map());
      if (!this.cooldown.get(user.id)?.has(cooldownId))
        this.cooldown.get(user.id)?.set(cooldownId, 0);

      const cooldown = this.cooldown.get(user.id)?.get(cooldownId) ?? 0;
      if (cooldown > now)
        return {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_CommandCooldown_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_CommandCooldown_Description',
                  (cooldown / 1000) | 0,
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in message && { ephemeral: true }),
        };
      this.cooldown[user.id][cooldownId] = now + options.cooldown;
    }

    // Check Bot Permission
    if (message.guild && options?.permission?.bot) {
      const botPermission = DiscordUtil.checkPermission(
        message.guild?.members.me?.permissions,
        options.permission.bot,
      );
      if (!botPermission.status)
        return {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_BotRequirePermission_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_BotRequirePermission_Description',
                  `\`${botPermission?.require_permission
                    ?.map((v) => {
                      const permission =
                        DiscordUtil.convertPermissionToString(v);
                      return Language.get(
                        locale,
                        `Permission_${permission}` as keyof LanguageData,
                      );
                    })
                    ?.join('`, `')}\``,
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in message && { ephemeral: true }),
        };
    }

    // Check User Permission
    if (message.guild && options?.permission?.user) {
      const userPermission = DiscordUtil.checkPermission(
        'memberPermissions' in message
          ? message.memberPermissions
          : message.member?.permissions,
        options.permission?.user ?? [],
      );
      if (!userPermission.status)
        return {
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(locale, 'Embed_Warn_UserRequirePermission_Title'),
              )
              .setDescription(
                Language.get(
                  locale,
                  'Embed_Warn_UserRequirePermission_Description',
                  `\`${userPermission?.require_permission
                    ?.map((v) => {
                      const permission =
                        DiscordUtil.convertPermissionToString(v);
                      return Language.get(
                        locale,
                        `Permission_${permission}` as keyof LanguageData,
                      );
                    })
                    ?.join('`, `')}\``,
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: user.tag,
                iconURL: user.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
          ...('locale' in message && { ephemeral: true }),
        };
    }

    // Check botAdmin, botDeveloper
    if (
      (options?.botAdmin || options?.botDeveloper) &&
      ![
        ...(options?.botAdmin ? await DiscordUtil.adminId() : []),
        ...(options?.botDeveloper ? await DiscordUtil.developerId() : []),
      ].includes(user.id)
    )
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle(
              Language.get(locale, 'Embed_Warn_OnlyBotAdminCanUse_Title'),
            )
            .setDescription(
              Language.get(locale, 'Embed_Warn_OnlyBotAdminCanUse_Description'),
            )
            .setColor(EmbedConfig.WARN_COLOR)
            .setFooter({
              text: user.tag,
              iconURL: user.avatarURL() || undefined,
            })
            .setTimestamp(),
        ],
        allowedMentions: { parse: [] },
        ...('locale' in message && { ephemeral: true }),
      };

    // Check guildOwner
    if (options?.guildOwner && message.guild?.ownerId != user.id)
      return {
        embeds: [
          new EmbedBuilder()
            .setTitle(
              Language.get(locale, 'Embed_Warn_OnlyGuildOwnerCanUse_Title'),
            )
            .setDescription(
              Language.get(
                locale,
                'Embed_Warn_OnlyGuildOwnerCanUse_Description',
              ),
            )
            .setColor(EmbedConfig.WARN_COLOR)
            .setFooter({
              text: user.tag,
              iconURL: user.avatarURL() || undefined,
            })
            .setTimestamp(),
        ],
        allowedMentions: { parse: [] },
        ...('locale' in message && { ephemeral: true }),
      };

    return null;
  }
}
