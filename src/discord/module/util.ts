import {
  PermissionResolvable,
  PermissionsBitField,
  REST,
  Routes,
} from 'discord.js';

export class DiscordUtil {
  private static expire = 0;
  private static client_id = '';
  private static other_client_id = [] as string[];
  private static admin_id = [] as string[];
  private static developer_id = [] as string[];

  private static async getValues() {
    if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
    const rest = new REST().setToken(process.env.BOT_TOKEN);
    const result: any = await rest.get(Routes.currentApplication());
    this.client_id = result.id;
    this.admin_id = result.team
      ? result.team.members
          .filter((v) => v.role == 'admin')
          .map((v) => v.user.id as string)
      : [result.owner.id as string];
    this.developer_id = result.team
      ? result.team.members
          .filter((v) => v.role == 'developer')
          .map((v) => v.user.id as string)
      : [];
    this.other_client_id =
      result.team && process.env.DISCORD_TOKEN
        ? (
            await (
              await fetch(
                'https://discord.com/api/v10/applications?with_team_applications=true',
                { headers: { Authorization: process.env.DISCORD_TOKEN } },
              )
            ).json()
          )
            .map((v) => v.id)
            .filter((v) => v != result.id)
        : [];
    this.expire = Date.now() + 1000 * 60 * 60 * 4;
  }

  static async clientId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.client_id;
  }

  static async otherClientId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.other_client_id;
  }

  static async adminId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.admin_id;
  }

  static async developerId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.developer_id;
  }

  static convertPermissionToString(
    value: PermissionResolvable,
  ): keyof typeof PermissionsBitField.Flags {
    if (typeof value != 'bigint' && !/^-?\d+$/.test(value.toString()))
      return value as keyof typeof PermissionsBitField.Flags;
    return Object.entries(PermissionsBitField.Flags).find(
      ([, v]) => v == value,
    )![0] as keyof typeof PermissionsBitField.Flags;
  }

  static checkPermission(
    memberPermission: Readonly<PermissionsBitField> | undefined | null,
    permission: PermissionResolvable | PermissionResolvable[],
  ): { status: boolean; require_permission?: PermissionResolvable[] } {
    if (!memberPermission) return { status: false };
    const require_permission = [] as PermissionResolvable[];
    for (const p of Array.isArray(permission) ? permission : [permission])
      if (!memberPermission.has(p)) require_permission.push(p);
    return { status: require_permission.length == 0, require_permission };
  }
}
