import {
  PermissionFlagsBits,
  PermissionResolvable,
  REST,
  Routes,
} from 'discord.js';

export class DiscordUtil {
  private static expire = 0;
  private static client_id = '';
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
    this.expire = Date.now() + 1000 * 60 * 60 * 4;
  }

  static async clientId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.client_id;
  }

  static async adminId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.admin_id;
  }

  static async developerId() {
    if (this.expire < Date.now()) await this.getValues();
    return this.developer_id;
  }

  static permission(
    value: PermissionResolvable,
  ): keyof typeof PermissionFlagsBits | null {
    if (typeof value != 'bigint' && !/^-?\d+$/.test(value.toString()))
      return value as keyof typeof PermissionFlagsBits;
    return (
      (Object.entries(PermissionFlagsBits).find(
        ([, v]) => v == value,
      )?.[0] as keyof typeof PermissionFlagsBits) ?? null
    );
  }
}
