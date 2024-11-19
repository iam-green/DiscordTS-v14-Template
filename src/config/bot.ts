import {
  ClientOptions,
  GatewayIntentBits,
  LocaleString,
  Options,
} from 'discord.js';

export const BotConfig = {
  NAME: 'Template',
  COMMAND_PREFIX: ['/', '?', '!', '?!'],
  DEFAULT_LANGUAGE: 'en-US' as LocaleString,
  CLIENT_OPTION: {
    intents: [
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
    sweepers: {
      ...Options.DefaultSweeperSettings,
      messages: { interval: 3600, lifetime: 1800 },
      users: {
        interval: 3600,
        filter: () => (user) => user.bot && user.id != user.client.user.id,
      },
    },
  } as ClientOptions,
};
