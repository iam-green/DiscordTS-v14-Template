<h1 align="center">DiscordTS v14 Template</h1>
<p align="center">
  DiscordJS template for easy use of many commands, events, components and more<br>
  <a href="/README.md">English</a>
  &nbsp;|&nbsp;
  <a href="/docs/ko/README.md">한국어</a>
</p>

> ⚠️ **This repository is no longer maintained and has been deprecated.**  
> If you need maintenance or updates, please refer to the [alternative repository](https://github.com/iam-green/discordjs-template).

> [!NOTE]
> Do you want a JavaScript version template?<br>
> [Here](https://github.com/iam-green/DiscordJS-v14-Template) is a JavaScript version template!

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Command, Component, Event Structure](#command-component-event-structure)
  - [Text Command](#text-command)
  - [Application Command](#application-command)
  - [Component](#component)
  - [Event](#event)
- [License](#license)

## Installation

1. [Download](https://github.com/iam-green/DiscordTS-v14-Template/archive/refs/heads/v3.zip) and decompress or clone this project.
2. Rename your project in the `package.json` file.
3. Rename the following files:
   - `.env.example` → `.env`: Used for secrets, like the Discord Bot Token.
4. Fill all the required values in `.env`.
5. Install all required dependencies: `npm install`
6. Build a TypeScript project: `npm run build`
7. Run the command `npm run start` to start the bot.

## Features

- Support latest version of [discord.js](https://discord.js.org/)
- Support [Drizzle ORM](/docs/en-US/database.md) for using Database
- Supports all possible type of commands
  - Text Commands
  - Application Commands
    - Chat Input
      - Support Autocomplete
    - User Context
    - Message Context
- Handles Components
  - Buttons
  - Select Menus
- Easy-to-use [modules](/docs/en-US/module.md)

## Command, Component, Event Structure

### Text Command

```ts
new ExtendedTextCommand({
  name: string | string[], // Command name
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // Permissions required by the user to use the command
      bot: PermissionResolvable[], // Permissions required by bots to execute commands
    }>,
    cooldown: number, // Command cooldown
    guildId: string[], // Use when you want to use it in a specific guild
    onlyGuild: boolean, // Whether to run on Guild only
    botAdmin: boolean, // Available if the bot has a team, only team's Admin enabled
    botDeveloper: boolean, // Available if the bot has a team, only the team's developers set it up
    guildOwner: boolean, // Enable only owners of Guild
  }>,
  run: (options: {
    client: ExtendedClient,
    message: Message,
    locale: Locale,
  }) => void
});
```

<a style="color: gray;" href="/src/structure/text_command.ts">/src/structure/text_command.ts</a>

The bot will automatically call you when you write it from the <u>**/src/textCommand/\*\*/\***</u> location.

### Application Command

```ts
new ExtendedApplicationCommand({
  type: ApplicationCommandType; // ChatInput, User, Message
  name: string | string[]; // Command name
  description?: string | string[]; // Available when type is ChatInput, Command description
  localization?: Partial<{
    name: LocalizationMap | LocalizationMap[]; // Translated command name by language
    description: LocalizationMap | LocalizationMap[]; // Available when type is ChatInput, Translated command description by language
  }>;
  command?: // Available when type is ChatInput
    APIApplicationCommand | // Command JSON
    (builder: SlashCommandBuilder) => SlashCommandBuilder, // Command Builder
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // Permissions required by the user to use the command
      bot: PermissionResolvable[], // Permissions required by bots to execute commands
    }>,
    cooldown: number, // Command cooldown
    guildId: string[], // Use when you want to use it in a specific guild
    onlyGuild: boolean, // Whether to run on Guild only
    botAdmin: boolean, // Available if the bot has a team, only team's Admin enabled
    botDeveloper: boolean, // Available if the bot has a team, only the team's developers set it up
    guildOwner: boolean, // Enable only owners of Guild
  }>;
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
    args?: CommandInteractionOptionResolver,
  }) => void,
  autoComplete?: (options: AutoCompleteOptions) => void // Available when type is ChatInput
});
```

<a style="color: gray;" href="/src/structure/application_command.ts">/src/structure/application_command.ts</a>

The bot will automatically call you when you write it from the <u>**/src/command/\*\*/\***</u> location.

### Component

```ts
ExtendedComponent({
  type: ComponentType, // Button, StringSelect, TextInput, UserSelect, RoleSelect, MentionableSelect, ChannelSelect
  id: string, // Component ID
  component: APIComponent | // Component JSON
    (option: Builder) => Builder, // Componenet Builder
  once?: boolean, // Whether to run only once
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // Permissions required by the user to use the command
      bot: PermissionResolvable[], // Permissions required by bots to execute commands
    }>,
    expire: number, // Component expiration time
    cooldown: number, // Command cooldown
    guildId: string[], // Use when you want to use it in a specific guild
    onlyGuild: boolean, // Whether to run on Guild only
    botAdmin: boolean, // Available if the bot has a team, only team's Admin enabled
    botDeveloper: boolean, // Available if the bot has a team, only the team's developers set it up
    guildOwner: boolean, // Enable only owners of Guild
  }>,
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
  }) => void
});
```

<a style="color: gray;" href="/src/structure/component.ts">/src/structure/component.ts</a>

We recommend writing your component code in <u>**/src/component/\*\*/\***</u>.

### Event

```ts
new ExtendedEvent({
  event: keyof ClientEvents, // Event key
  once?: boolean, // Whether to run only once
  run: (
    client: ExtendedClient,
    ...args: ClientEvents[keyof ClientEvents],
  ) => void
});
```

<a style="color: gray;" href="/src/structure/event.ts">/src/structure/event.ts</a>

The bot will automatically call you when you write it from the <u>**/src/event/\*\*/\***</u> location.

## License

[**GPL-3.0**](/LICENSE), General Public License v3
