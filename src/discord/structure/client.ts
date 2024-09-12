import {
  BaseMessageOptions,
  CacheType,
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  Events,
  Interaction,
  InteractionReplyOptions,
  LocaleString,
  Message,
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import { Log, TimeoutMessage } from '../../module';
import { ClusterClient } from 'discord-hybrid-sharding';
import { Command, ExtendedInteraction } from './command';
import { Event } from './event';
import { DiscordUtil, Language, LanguageData } from '../module';
import { BotConfig, EmbedConfig } from '../../config';
import chalk from 'chalk';
import { Menu } from './menu';
import { TextCommand } from './textCommand';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);
  private cooldown: Record<string, Record<string, number>> = {};
  private prefix = `${chalk.cyan('[')}Cluster ${chalk.green(
    `#${this.cluster.id}`,
  )}${chalk.cyan(']')}`;
  locale: Record<string, LocaleString> = {};

  constructor(option: ClientOptions) {
    super(option);
  }

  async start() {
    await Language.init();
    await this.registerModules();
    await this.login(process.env.BOT_TOKEN);
    Log.info(`${this.prefix} Logged in as ${chalk.green(this.user?.tag)}!`);
  }

  private async registerModules() {
    await this.addAutoComplete();
    await this.addCommands();
    await this.addTextCommands();
    await this.addEvents();
    await this.addMenus();
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
  }

  private async addAutoComplete() {
    const commands = await Command.getAllCommands();
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
      const command = commands.find((c) => c.command.name == name)?.command;
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
    const commands = await Command.getAllCommands();
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      // Add Locale
      if (
        !this.locale[interaction.user.id] ||
        this.locale[interaction.user.id] != interaction.locale
      )
        this.locale[interaction.user.id] = interaction.locale;

      // Find Command
      const name = [
        interaction.commandName,
        interaction.options.getSubcommandGroup(false),
        interaction.options.getSubcommand(false),
      ]
        .filter((v) => v)
        .join(' ');
      const command = commands.find((c) => c.command.name == name)?.command;
      if (!command) return;

      // Check Options
      const validate = await this.checkOptions(
        interaction,
        null,
        command.options,
      );
      if (validate) return interaction.reply(validate);

      // Run Command
      command.run({
        args: interaction.options as CommandInteractionOptionResolver,
        client: this,
        interaction: interaction as ExtendedInteraction,
      });
    });
  }

  private async addEvents() {
    const events = await Event.getEvents();
    for (const { event } of events)
      this[event.once ? 'once' : 'on'](event.event, (...args) =>
        event.run(this, ...args),
      );
  }

  private async addMenus() {
    const menus = await Menu.getAllMenus();
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isContextMenuCommand()) return;

      // Find Menu
      const menu = menus.find((v) =>
        v.menu.name.includes(interaction.commandName),
      )?.menu;
      if (!menu) return;

      // Check Options
      const validate = await this.checkOptions(interaction, null, {
        ...menu.options,
        permission: menu.permission,
      });
      if (validate) return interaction.reply(validate);

      // Run Menu
      menu.run({
        client: this,
        interaction: interaction as ExtendedInteraction &
          (
            | UserContextMenuCommandInteraction<CacheType>
            | MessageContextMenuCommandInteraction<CacheType>
          ),
      });
    });
  }

  private async addTextCommands() {
    const commnads = await TextCommand.getCommands();
    this.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;

      // Check Prefix
      let prefix = '';
      for (const p of BotConfig.PREFIX.sort((a, b) => b.length - a.length))
        if (message.content.trim().startsWith(p)) {
          prefix = p;
          break;
        }
      if (!prefix) return;

      // Find Text Command
      const content = message.content.slice(prefix.length).trim();
      const command = commnads.find((command) => {
        for (const name of command.command.name)
          if (content.startsWith(name)) return true;
        return false;
      })?.command;
      if (!command) return;

      // Check Options
      const validate = await this.checkOptions(
        message,
        Array.isArray(command.name) ? command.name[0] : command.name,
        {
          ...command.options,
          permission: command.permission,
        },
      );
      if (validate) {
        const replied = await message.reply(validate);
        TimeoutMessage.set(replied, 1000 * 5);
        return;
      }

      // Run Command
      command.run({
        client: this,
        locale: this.locale[message.author.id] || 'en-US',
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
        : this.locale[message.author.id] || 'en-US';
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
      if (!this.cooldown[user.id]) this.cooldown[user.id] = {};
      if (!this.cooldown[user.id][cooldownId])
        this.cooldown[user.id][cooldownId] = 0;

      const cooldown = this.cooldown[user.id][cooldownId];
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
                  `\`${Math.round((cooldown - now) / 100) / 10}\``,
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
