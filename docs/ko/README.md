<h1 align="center">DiscordTS v14 Template</h1>
<p align="center">
  많은 명령어, 이벤트, 컴포넌트 등을 만들기 쉽게 하는 DiscordJS 템플릿<br>
  <a href="/README.md">English</a>
  &nbsp;|&nbsp;
  <a href="/docs/ko/README.md">한국어</a>
</p>

## 목차

- [설치 과정](#설치-과정)
- [기능](#기능)
- [명령어, 컴포넌트, 이벤트 구조](#명령어-컴포넌트-이벤트-구조)
  - [텍스트 명령어](#텍스트-명령어)
  - [어플리케이션 명령어](#어플리케이션-명령어)
  - [컴포넌트](#컴포넌트)
  - [이벤트](#이벤트)
- [라이선스](#라이선스)

## 설치 과정

1. 프로젝트를 [다운로드](https://github.com/iam-green/DiscordTS-v14-Template/archive/refs/heads/v3.zip) 및 압축해제를 하거나 복제하세요.
2. `package.json` 파일에 있는 프로젝트 이름을 바꾸세요.
3. 아래 파일들의 이름을 변경하세요:
   - `.env.example` → `.env`: Discord Bot 토큰과 같은 환경변수 값을 저장하는데 사용합니다.
4. `.env`의 모든 필수 값을 입력합니다.
5. 필요한 모든 종속성 설치하세요: `npm install`
6. TypeScript 프로젝트를 빌드하세요: `npm run build`
7. `npm run start` 명령어를 사용하여 봇을 실행하세요.

## 기능

- [discord.js](https://discord.js.org/) 최신 버전 지원
- 데이터베이스 사용을 위한 [Drizzle ORM](/docs/ko/database.md) 지원
- 모든 종류의 명령어 지원
  - 텍스트 명령어
  - 어플리케이션 명령어
    - 채팅 입력
      - 자동완성 지원
    - 유저 컨텍스트
    - 메세지 컨텍스트
- 컴포넌트 처리
  - 버튼
  - 선택 메뉴
- 사용하기 쉬운 [모듈](/docs/ko/module.md)

## 명령어, 컴포넌트, 이벤트 구조

### 텍스트 명령어

```ts
new ExtendedTextCommand({
  name: string | string[], // 명령어 이름
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // 유저가 사용할 때 필요한 권한
      bot: PermissionResolvable[], // 봇이 실행할 때 필요한 권한
    }>,
    cooldown: number, // 명령어 쿨다운
    guildId: string[], // 특정 길드에서 사용하려는 경우 사용
    onlyGuild: boolean, // 길드에서만 실행할지 여부
    botAdmin: boolean, // 봇에 팀이 있는 경우, 팀의 관리자만 사용 가능 여부
    botDeveloper: boolean, // 봇에 팀이 있는 경우, 팀의 개발자만 사용 가능 여부
    guildOwner: boolean, // 서버 소유자만 사용 가능 여부
  }>,
  run: (options: {
    client: ExtendedClient,
    message: Message,
    locale: LocaleString,
  }) => void
});
```

<a style="color: gray;" href="/src/structure/text_command.ts">/src/structure/text_command.ts</a>

<u>**/src/textCommand/\*\*/\***</u> 위치에서 작성하면 봇이 자동으로 코드를 사용합니다.

### 어플리케이션 명령어

```ts
new ExtendedApplicationCommand({
  type: ApplicationCommandType, // ChatInput, User, Message
  name: string | string[], // 명령어 이름
  description?: string | string[], // type이 ChatInput인 경우 사용 가능, 명령어 설명
  localization?: Partial<{
    name: LocalizationMap | LocalizationMap[], // 언어별 명령어 이름 번역
    description: LocalizationMap | LocalizationMap[], // type이 ChatInput인 경우 사용 가능, 언어별 명령어 설명 번역
  }>,
  command?: // type이 ChatInput인 경우 사용 가능
    APIApplicationCommand | // 명령어 JSON
    (builder: SlashCommandBuilder) => SlashCommandBuilder, // 명령어 Builder
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // 유저가 사용할 때 필요한 권한
      bot: PermissionResolvable[], // 봇이 실행할 때 필요한 권한
    }>,
    cooldown: number, // 명령어 쿨다운
    guildId: string[], // 특정 길드에서 사용하려는 경우 사용
    onlyGuild: boolean, // 길드에서만 실행할지 여부
    botAdmin: boolean, // 봇에 팀이 있는 경우, 팀의 관리자만 사용 가능 여부
    botDeveloper: boolean, // 봇에 팀이 있는 경우, 팀의 개발자만 사용 가능 여부
    guildOwner: boolean, // 서버 소유자만 사용 가능 여부
  }>;
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
    args?: CommandInteractionOptionResolver,
  }) => void,
  autoComplete?: (options: AutoCompleteOptions) => void // type이 ChatInput인 경우 사용 가능
});
```

<a style="color: gray;" href="/src/structure/application_command.ts">/src/structure/application_command.ts</a>

<u>**/src/command/\*\*/\***</u> 위치에서 작성하면 봇이 자동으로 코드를 사용합니다.

### 컴포넌트

```ts
ExtendedComponent({
  type: ComponentType, // Button, StringSelect, TextInput, UserSelect, RoleSelect, MentionableSelect, ChannelSelect
  id: string, // 컴포넌트 ID
  component: APIComponent | // 컴포넌트 JSON
    (option: Builder) => Builder, // 컴포넌트 Builder
  once?: boolean, // 한번만 실행 여부
  options?: Partial<{
    permission: Partial<{
      user: PermissionResolvable[], // 유저가 사용할 때 필요한 권한
      bot: PermissionResolvable[], // 봇이 실행할 때 필요한 권한
    }>,
    expire: number, // 컴포넌트 만료 시간
    cooldown: number, // 명령어 쿨다운
    guildId: string[], // 특정 길드에서 사용하려는 경우 사용
    onlyGuild: boolean, // 길드에서만 실행할지 여부
    botAdmin: boolean, // 봇에 팀이 있는 경우, 팀의 관리자만 사용 가능 여부
    botDeveloper: boolean, // 봇에 팀이 있는 경우, 팀의 개발자만 사용 가능 여부
    guildOwner: boolean, // 서버 소유자만 사용 가능 여부
  }>,
  run: (options: {
    client: ExtendedClient,
    interaction: Interaction,
  }) => void
});
```

<a style="color: gray;" href="/src/structure/component.ts">/src/structure/component.ts</a>

컴포넌트 코드를 <u>**/src/component/\*\*/\***</u>에서 작성하는 것을 추천합니다.

### 이벤트

```ts
new ExtendedEvent({
  event: keyof ClientEvents, // 이벤트 key
  once?: boolean, // 한번만 실행 여부
  run: (
    client: ExtendedClient,
    ...args: ClientEvents[keyof ClientEvents],
  ) => void
});
```

<a style="color: gray;" href="/src/structure/event.ts">/src/structure/event.ts</a>

<u>**/src/event/\*\*/\***</u> 위치에서 작성하면 봇이 자동으로 코드를 사용합니다.

## 라이선스

[**GPL-3.0**](/LICENSE), General Public License v3
