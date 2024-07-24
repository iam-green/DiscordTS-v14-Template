import { EmbedBuilder } from 'discord.js';
import { ExtendedCommand } from '../discord';

export default new ExtendedCommand({
  name: ['정보'],
  localization: { ko: '정보', 'en-US': 'info' },
  builder: (builder) =>
    builder
      .setDescription('봇 정보를 확인합니다.')
      .setDescriptionLocalizations({
        ko: '봇 정보를 확인합니다.',
        'en-US': 'Check bot information.',
      }),
  run: async ({ interaction, client }) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ ephemeral: true });

    const promises = await Promise.all([
      (client.cluster.fetchClientValues('guilds.cache.size') || []) as Promise<
        number[]
      >,
      (client.cluster.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      ) || []) as Promise<number[]>,
    ]);

    const guilds = promises[0].reduce((a, b) => a + b, 0);
    const members = promises[1].reduce((a, b) => a + b, 0);

    return await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#fba0a7')
          .setTitle(`봇 정보`)
          .addFields(
            {
              name: '서버 수',
              value: `\`${guilds}\`개`,
              inline: true,
            },
            {
              name: '멤버 수',
              value: `\`${members}\`명`,
              inline: true,
            },
            {
              name: '클러스터',
              value: `\`${client.cluster.count}\`개 중 \`${client.cluster.id + 1}\`번 클러스터`,
            },
            {
              name: '샤드',
              value: `\`${client.cluster.info.TOTAL_SHARDS}\`개 중 \`${interaction.guild.shardId + 1}\`번 샤드`,
            },
          )
          .setFooter({
            text: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTimestamp(),
      ],
    });
  },
});
