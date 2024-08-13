import { REST, Routes } from 'discord.js';

export class DiscordUtil {
  private static client_id = '';
  private static owner_id = { data: [] as string[], expire: 0 };

  static async clientId() {
    if (!this.client_id) {
      if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
      const rest = new REST().setToken(process.env.BOT_TOKEN);
      const result: any = await rest.get(Routes.currentApplication());
      this.client_id = result.id;
    }
    return this.client_id;
  }

  static async ownerId() {
    if (this.owner_id.data.length < 1 || this.owner_id.expire < Date.now()) {
      if (!process.env.BOT_TOKEN) throw new Error('No Bot Token');
      const rest = new REST().setToken(process.env.BOT_TOKEN);
      const result: any = await rest.get(Routes.currentApplication());
      this.owner_id.data = result.team
        ? result.team.members
            .filter((v) => v.role == 'admin')
            .map((v) => v.user.id as string)
        : [result.owner.id as string];
      this.owner_id.expire = Date.now() + 1000 * 60 * 60;
    }
    return this.owner_id.data;
  }
}
