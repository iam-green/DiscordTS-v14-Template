import { EmbedBuilder } from 'discord.js';
import { ExtendedCommand } from '../discord';

export default new ExtendedCommand({
  name: ['정보'],
  command: (builder) => builder.setDescription('봇 정보를 확인합니다.'),
  run: async ({ interaction, client }) => {
    if (!interaction.guild) return;

    const promises = await Promise.all([
      (client.shard?.fetchClientValues('guilds.cache.size') || []) as Promise<
        number[]
      >,
      (client.shard?.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      ) || []) as Promise<number[]>,
    ]);

    const guilds = promises[0].reduce((a, b) => a + b, 0);
    const members = promises[1].reduce((a, b) => a + b, 0);

    return await interaction.reply({
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
              name: '샤드',
              value: `\`${client.shard?.count}\`개 중 \`${client.shard!.ids[0] + 1}\`번 샤드`,
            },
          )
          .setFooter({
            text: interaction.user.tag,
            iconURL: interaction.user.avatarURL() || undefined,
          })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
});
