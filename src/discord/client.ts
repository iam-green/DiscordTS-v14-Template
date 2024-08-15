import {
  Client,
  ClientOptions,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  Events,
} from 'discord.js';
import { Log } from '../module';
import { ClusterClient } from 'discord-hybrid-sharding';
import { Command, ExtendedInteraction } from './command';
import { Event } from './event';
import { DiscordUtil } from './util';
import { Language, LanguageData } from './language';
import { EmbedConfig } from '../config';
import chalk from 'chalk';

export class ExtendedClient extends Client {
  cluster = new ClusterClient(this);
  private cooldown: Record<string, Record<string, number>> = {};
  private prefix = `${chalk.cyan('[')}Cluster ${chalk.green(
    `#${this.cluster.id}`,
  )}${chalk.cyan(']')}`;

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
    await this.addEvents();
    this.on('shardReady', async (id) =>
      Log.info(`${this.prefix} Shard ${chalk.green(`#${id}`)} is ready!`),
    );
  }

  private async addCommands() {
    const commands = await Command.getAllCommands();
    this.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

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

      // Check Bot Permission
      const requireBotPermission: string[] = [];
      for (const permission of command.permission?.bot ?? [])
        if (!interaction.guild?.members.me?.permissions.has(permission))
          requireBotPermission.push(
            Language.get(
              interaction.locale,
              `Permission_${DiscordUtil.permission(permission)}` as keyof LanguageData,
            ),
          );
      if (requireBotPermission.length > 0)
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
                    `\`${requireBotPermission.join('`, `')}\``,
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
      const requireUserPermission: string[] = [];
      for (const permission of command.permission?.user ?? [])
        if (!interaction.memberPermissions?.has(permission))
          requireUserPermission.push(
            Language.get(
              interaction.locale,
              `Permission_${DiscordUtil.permission(permission)}` as keyof LanguageData,
            ),
          );
      if (requireUserPermission.length > 0)
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
                    `\`${requireUserPermission.join('`, `')}\``,
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
      await command.run({
        args: interaction.options as CommandInteractionOptionResolver,
        client: this,
        interaction: interaction as ExtendedInteraction,
      });
    });
  }

  private async addEvents() {
    const events = await Event.getEvents();
    for (const { event } of events)
      this[event.once ? 'once' : 'on'](
        event.event,
        async (...args) => await event.run(this, ...args),
      );
  }
}
