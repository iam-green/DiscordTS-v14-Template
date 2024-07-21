export class DiscordUtil {
  private static client_id = '';
  private static owner_id = '';

  static async clientId() {
    if (!this.client_id) {
      const data = await fetch(
        'https://discordapp.com/api/oauth2/applications/@me',
        {
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
        },
      );
      const json = await data.json();
      this.client_id = json.id as string;
    }
    return this.client_id;
  }

  static async ownerId() {
    if (!this.owner_id) {
      const data = await fetch(
        'https://discordapp.com/api/oauth2/applications/@me',
        {
          headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
        },
      );
      const json = await data.json();
      this.owner_id = (json.team.owner_user_id || json.owner.id) as string;
    }
    return this.owner_id;
  }
}
