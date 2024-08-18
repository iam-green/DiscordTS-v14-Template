import {
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  Events,
  LocaleString,
} from 'discord.js';
import { Log } from '../../module';
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
  private locale: Record<string, LocaleString> = {};

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
    await this.addCommands();
    await this.addTextCommands();
    await this.addEvents();
    await this.addMenus();
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
  }

  private async addCommands() {
    const commands = await Command.getAllCommands();
    this.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isAutocomplete()) {
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
      }

      if (!interaction.isChatInputCommand()) return;

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

      // Check Guild Only
      if (command.options?.onlyGuild && !interaction.guild)
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(
                  interaction.locale,
                  'Embed_Warn_OnlyCanUseInGuild_Title',
                ),
              )
              .setDescription(
                Language.get(
                  interaction.locale,
                  'Embed_Warn_OnlyCanUseInGuild_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: interaction.user.tag,
                iconURL: interaction.user.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          ephemeral: true,
        });

      // Check Cooldown
      if (command.options?.cooldown) {
        const now = Date.now();
        if (!this.cooldown[interaction.user.id])
          this.cooldown[interaction.user.id] = {};
        if (!this.cooldown[interaction.user.id][interaction.commandId])
          this.cooldown[interaction.user.id][interaction.commandId] = 0;
        const cooldown =
          this.cooldown[interaction.user.id][interaction.commandId];
        if (cooldown > now)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_CommandCooldown_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_CommandCooldown_Description',
                      `\`${Math.round((cooldown - now) / 100) / 10}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});
        this.cooldown[interaction.user.id][interaction.commandId] =
          now + command.options.cooldown;
      }

      if (interaction.guild) {
        // Check Bot Permission
        const botPermission = DiscordUtil.checkPermission(
          interaction.guild.members.me?.permissions,
          command.permission?.bot ?? [],
        );
        if (!botPermission.status)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_BotRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_BotRequirePermission_Description',
                      `\`${botPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            interaction.locale,
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});

        // Check User Permission
        const userPermission = DiscordUtil.checkPermission(
          interaction.memberPermissions,
          command.permission?.user ?? [],
        );
        if (!userPermission.status)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_UserRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_UserRequirePermission_Description',
                      `\`${userPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            interaction.locale,
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});
      }

      // Check botAdmin, botDeveloper
      if (
        (command.options?.botAdmin || command.options?.botDeveloper) &&
        ![
          ...(command.options?.botAdmin ? await DiscordUtil.adminId() : []),
          ...(command.options?.botDeveloper
            ? await DiscordUtil.developerId()
            : []),
        ].includes(interaction.user.id)
      )
        return interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyBotAdminCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyBotAdminCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: interaction.user.tag,
                  iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            ephemeral: true,
          })
          .catch(() => {});

      // Check guildOwner
      if (
        command.options?.guildOwner &&
        interaction.guild?.ownerId != interaction.user.id
      )
        return interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyGuildOwnerCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyGuildOwnerCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: interaction.user.tag,
                  iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            ephemeral: true,
          })
          .catch(() => {});

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

      // Check Guild Only
      if (menu.options?.onlyGuild && !interaction.guild)
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(
                  interaction.locale,
                  'Embed_Warn_OnlyCanUseInGuild_Title',
                ),
              )
              .setDescription(
                Language.get(
                  interaction.locale,
                  'Embed_Warn_OnlyCanUseInGuild_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: interaction.user.tag,
                iconURL: interaction.user.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          ephemeral: true,
        });

      // Check Cooldown
      if (menu.options?.cooldown) {
        const now = Date.now();
        if (!this.cooldown[interaction.user.id])
          this.cooldown[interaction.user.id] = {};
        if (!this.cooldown[interaction.user.id][interaction.commandId])
          this.cooldown[interaction.user.id][interaction.commandId] = 0;
        const cooldown =
          this.cooldown[interaction.user.id][interaction.commandId];
        if (cooldown > now)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_CommandCooldown_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_CommandCooldown_Description',
                      `\`${Math.round((cooldown - now) / 100) / 10}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});
        this.cooldown[interaction.user.id][interaction.commandId] =
          now + menu.options.cooldown;
      }

      if (interaction.guild) {
        // Check Bot Permission
        const botPermission = DiscordUtil.checkPermission(
          interaction.guild.members.me?.permissions,
          menu.permission?.bot ?? [],
        );
        if (!botPermission.status)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_BotRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_BotRequirePermission_Description',
                      `\`${botPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            interaction.locale,
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});

        // Check User Permission
        const userPermission = DiscordUtil.checkPermission(
          interaction.memberPermissions,
          menu.permission?.user ?? [],
        );
        if (!userPermission.status)
          return interaction
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_UserRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      interaction.locale,
                      'Embed_Warn_UserRequirePermission_Description',
                      `\`${userPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            interaction.locale,
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: interaction.user.tag,
                    iconURL: interaction.user.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              ephemeral: true,
            })
            .catch(() => {});
      }

      // Check botAdmin, botDeveloper
      if (
        (menu.options?.botAdmin || menu.options?.botDeveloper) &&
        ![
          ...(menu.options?.botAdmin ? await DiscordUtil.adminId() : []),
          ...(menu.options?.botDeveloper
            ? await DiscordUtil.developerId()
            : []),
        ].includes(interaction.user.id)
      )
        return interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyBotAdminCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyBotAdminCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: interaction.user.tag,
                  iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            ephemeral: true,
          })
          .catch(() => {});

      // Check guildOwner
      if (
        menu.options?.guildOwner &&
        interaction.guild?.ownerId != interaction.user.id
      )
        return interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyGuildOwnerCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    interaction.locale,
                    'Embed_Warn_OnlyGuildOwnerCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: interaction.user.tag,
                  iconURL: interaction.user.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            ephemeral: true,
          })
          .catch(() => {});

      // Run Menu
      menu.run({
        client: this,
        interaction: interaction as ExtendedInteraction,
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

      // Check Guild Only
      if (command.options?.onlyGuild && !message.guild)
        return await message.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                Language.get(
                  this.locale[message.author.id] || 'en-US',
                  'Embed_Warn_OnlyCanUseInGuild_Title',
                ),
              )
              .setDescription(
                Language.get(
                  this.locale[message.author.id] || 'en-US',
                  'Embed_Warn_OnlyCanUseInGuild_Description',
                ),
              )
              .setColor(EmbedConfig.WARN_COLOR)
              .setFooter({
                text: message.author.tag,
                iconURL: message.author.avatarURL() || undefined,
              })
              .setTimestamp(),
          ],
          allowedMentions: { parse: [] },
        });

      // Check Cooldown
      const commandName = Array.isArray(command.name)
        ? command.name[0]
        : command.name;
      if (command.options?.cooldown) {
        const now = Date.now();
        if (!this.cooldown[message.author.id])
          this.cooldown[message.author.id] = {};
        if (!this.cooldown[message.author.id][commandName])
          this.cooldown[message.author.id][commandName] = 0;
        const cooldown = this.cooldown[message.author.id][commandName];
        if (cooldown > now)
          return message
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_CommandCooldown_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_CommandCooldown_Description',
                      `\`${Math.round((cooldown - now) / 100) / 10}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: message.author.tag,
                    iconURL: message.author.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              allowedMentions: { parse: [] },
            })
            .catch(() => {});
        this.cooldown[message.author.id][commandName] =
          now + command.options.cooldown;
      }

      if (message.guild) {
        // Check Bot Permission
        const botPermission = DiscordUtil.checkPermission(
          message.guild.members.me?.permissions,
          command.permission?.bot ?? [],
        );
        if (!botPermission.status)
          return message
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_BotRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_BotRequirePermission_Description',
                      `\`${botPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            this.locale[message.author.id] || 'en-US',
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: message.author.tag,
                    iconURL: message.author.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              allowedMentions: { parse: [] },
            })
            .catch(() => {});

        // Check User Permission
        const userPermission = DiscordUtil.checkPermission(
          message.member?.permissions,
          command.permission?.user ?? [],
        );
        if (!userPermission.status)
          return message
            .reply({
              embeds: [
                new EmbedBuilder()
                  .setTitle(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_UserRequirePermission_Title',
                    ),
                  )
                  .setDescription(
                    Language.get(
                      this.locale[message.author.id] || 'en-US',
                      'Embed_Warn_UserRequirePermission_Description',
                      `\`${userPermission?.require_permission
                        ?.map((v) => {
                          const permission =
                            DiscordUtil.convertPermissionToString(v);
                          return Language.get(
                            this.locale[message.author.id] || 'en-US',
                            `Permission_${permission}` as keyof LanguageData,
                          );
                        })
                        ?.join('`, `')}\``,
                    ),
                  )
                  .setColor(EmbedConfig.WARN_COLOR)
                  .setFooter({
                    text: message.author.tag,
                    iconURL: message.author.avatarURL() || undefined,
                  })
                  .setTimestamp(),
              ],
              allowedMentions: { parse: [] },
            })
            .catch(() => {});
      }

      // Check botAdmin, botDeveloper
      if (
        (command.options?.botAdmin || command.options?.botDeveloper) &&
        ![
          ...(command.options?.botAdmin ? await DiscordUtil.adminId() : []),
          ...(command.options?.botDeveloper
            ? await DiscordUtil.developerId()
            : []),
        ].includes(message.author.id)
      )
        return message
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    this.locale[message.author.id] || 'en-US',
                    'Embed_Warn_OnlyBotAdminCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    this.locale[message.author.id] || 'en-US',
                    'Embed_Warn_OnlyBotAdminCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: message.author.tag,
                  iconURL: message.author.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            allowedMentions: { parse: [] },
          })
          .catch(() => {});

      // Check guildOwner
      if (
        command.options?.guildOwner &&
        message.guild?.ownerId != message.author.id
      )
        return message
          .reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(
                  Language.get(
                    this.locale[message.author.id] || 'en-US',
                    'Embed_Warn_OnlyGuildOwnerCanUse_Title',
                  ),
                )
                .setDescription(
                  Language.get(
                    this.locale[message.author.id] || 'en-US',
                    'Embed_Warn_OnlyGuildOwnerCanUse_Description',
                  ),
                )
                .setColor(EmbedConfig.WARN_COLOR)
                .setFooter({
                  text: message.author.tag,
                  iconURL: message.author.avatarURL() || undefined,
                })
                .setTimestamp(),
            ],
            allowedMentions: { parse: [] },
          })
          .catch(() => {});

      // Run Command
      command.run({
        client: this,
        locale: this.locale[message.author.id] || 'en-US',
        message,
      });
    });
  }
}
