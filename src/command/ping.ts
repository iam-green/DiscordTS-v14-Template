import { EmbedBuilder } from 'discord.js';
import { ExtendedCommand } from '../discord';

export default new ExtendedCommand({
  name: ['ping', '핑'],
  command: (builder) => builder.setDescription('replies with pong'),
  run: async ({ interaction }) => {
    if (!interaction.guild) return;

    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor('#fba0a7')
          .setTitle('Ping!')
          .setDescription(
            `\`\`\`Pong!\`\`\`\nin Shard \`#${interaction.client.shard?.ids[0]}\``,
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
