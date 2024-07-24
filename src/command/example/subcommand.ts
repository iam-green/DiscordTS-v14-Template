import { ExtendedCommand } from '../../discord';

export default new ExtendedCommand({
  name: '테스트 서브커맨드',
  localization: { ko: '테스트 서브커맨드', 'en-US': 'test subcommand' },
  builder: (builder) =>
    builder
      .setDescription('서브 커맨드 테스트입니다.')
      .setDescriptionLocalizations({
        ko: '서브 커맨드 테스트입니다.',
        'en-US': 'This is a subcommand test.',
      }),
  run: async ({ interaction }) => {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({
      content: `'테스트 테스트' 명령어입니다.`,
    });
  },
});
