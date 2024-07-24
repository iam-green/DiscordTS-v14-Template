import { ExtendedCommand } from '../../discord';

export default new ExtendedCommand({
  name: ['테스트 그룹커맨드 서브커맨드', '테스트 그룹 서브'],
  localization: [
    {
      ko: '테스트 그룹커맨드 서브커맨드',
      'en-US': 'test groupcommand subcommand',
    },
    {
      ko: '테스트 그룹 서브',
      'en-US': 'test group sub',
    },
  ],
  builder: (builder) =>
    builder
      .setDescription('그룹 명령어 테스트입니다.')
      .setDescriptionLocalizations({
        ko: '그룹 명령어 테스트입니다.',
        'en-US': 'This is a group command test.',
      }),
  run: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: `'테스트 그룹 테스트' 명령어입니다.`,
    });
  },
});
