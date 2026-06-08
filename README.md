# ThinkLinkBot

Discord bot for ThinkLink's Land.

## Running Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the real values.

3. Register slash commands:

   ```bash
   npm run deploy
   ```

4. Start the bot:

   ```bash
   npm start
   ```

## Pella Setup

Connect this GitHub repo in Pella, then set the environment variables in Pella's app settings instead of committing `.env`.

Required variables:

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID`
- `OWNER_ID`

Optional variable:

- `THINKLINK_USER_ID`

## Security Notes

- Never commit `.env` or bot tokens.
- Runtime data files such as `data/users.json`, `data/warnings.json`, and `data/wrappedStats.json` are ignored so user/server history does not get published.
- Static catalog files such as pets, jobs, rods, houses, fish, and crates are safe to keep in GitHub.
