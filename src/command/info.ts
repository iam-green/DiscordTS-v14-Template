import { ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { ExtendedApplicationCommand, Language } from '../discord';
import { BotConfig, EmbedConfig } from '../config';

export default new ExtendedApplicationCommand({
  type: ApplicationCommandType.ChatInput,
  name: 'info',
  description: 'Check the bot information.',
  localization: {
    name: { ko: '정보' },
    description: { ko: '봇 정보를 확인합니다.' },
  },
  options: { onlyGuild: true },
  run: async ({ interaction, client }) => {
    const promises = await Promise.all([
      (client.cluster.fetchClientValues('guilds.cache.size') || []) as Promise<
        number[]
      >,
      (client.cluster.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      ) || []) as Promise<number[]>,
    ]);

    return await interaction
      .reply({
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
                name: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_GuildCount_Title',
                ),
                value: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_GuildCount_Value',
                  promises[0].reduce((a, b) => a + b, 0),
                ),
                inline: true,
              },
              {
                name: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_UserCount_Title',
                ),
                value: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_UserCount_Value',
                  promises[1].reduce((a, b) => a + b, 0),
                ),
                inline: true,
              },
              {
                name: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_ClusterCount_Title',
                ),
                value: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_ClusterCount_Value',
                  client.cluster.count,
                  client.cluster.id + 1,
                ),
              },
              {
                name: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_ShardCount_Title',
                ),
                value: Language.get(
                  interaction.locale,
                  'Embed_Info_Field_ShardCount_Value',
                  client.cluster.info.TOTAL_SHARDS,
                  interaction.guild!.shardId + 1,
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
        ephemeral: true,
      })
      .catch(() => {});
  },
});
