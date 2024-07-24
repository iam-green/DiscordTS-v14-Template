import { ApplicationCommandType } from 'discord.js';
import { ExtendedMenu } from '../discord';

export default new ExtendedMenu({
  name: 'ping',
  localization: { ko: '핑', 'en-US': 'ping' },
  type: ApplicationCommandType.Message,
  run: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply('Pong!');
  },
});
