import { EmbedBuilder } from 'discord.js';
import { ExtendedCommand, Language } from '../discord';
import { BotConfig, EmbedConfig } from '../config';

export default new ExtendedCommand({
  name: 'info',
  description: 'Check the bot information.',
  localization: {
    name: { ko: '정보' },
    description: { ko: '봇 정보를 확인합니다.' },
  },
  run: async ({ interaction, client }) => {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    if (!interaction.deferred) return;
    if (!interaction.guild)
      return await interaction.editReply({
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
      });

    const promises = await Promise.all([
      (client.cluster.fetchClientValues('guilds.cache.size') || []) as Promise<
        number[]
      >,
      (client.cluster.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      ) || []) as Promise<number[]>,
    ]);

    return await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            Language.get(
              interaction.locale,
              'Embed_Info_Title',
              BotConfig.NAME,
            ),
          )
          .addFields(
            {
              name: Language.get(interaction.locale, 'Embed_Info_Guild_Title'),
              value: Language.get(
                interaction.locale,
                'Embed_Info_Guild_Value',
                promises[0].reduce((a, b) => a + b, 0),
              ),
              inline: true,
            },
            {
              name: Language.get(interaction.locale, 'Embed_Info_User_Title'),
              value: Language.get(
                interaction.locale,
                'Embed_Info_User_Value',
                promises[1].reduce((a, b) => a + b, 0),
              ),
              inline: true,
            },
            {
              name: Language.get(
                interaction.locale,
                'Embed_Info_Cluster_Title',
              ),
              value: Language.get(
                interaction.locale,
                'Embed_Info_Cluster_Value',
                client.cluster.count,
                client.cluster.id + 1,
              ),
            },
            {
              name: Language.get(interaction.locale, 'Embed_Info_Shard_Title'),
              value: Language.get(
                interaction.locale,
                'Embed_Info_Shard_Value',
                client.cluster.info.TOTAL_SHARDS,
                interaction.guild.shardId + 1,
              ),
            },
          )
          .setColor(EmbedConfig.SUCCESS_COLOR)
          .setFooter({
            text: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTimestamp(),
      ],
    });
  },
});
