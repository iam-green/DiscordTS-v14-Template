import { ApplicationCommandType } from 'discord.js';
import { ExtendedMenu } from '../discord';

export default new ExtendedMenu({
  name: ['ping', '핑'],
  type: ApplicationCommandType.Message,
  run: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply('Pong!');
  },
});
