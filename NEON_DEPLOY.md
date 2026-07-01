# Neon-backed on/off reveals

The app now supports database-backed scratch reveals through the Express API in `server/index.ts`.

## Environment variables

Set these on the hosting service:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST/DB?sslmode=require"
APP_URL="https://your-deployed-app.example"
```

`DATABASE_URL` should be the pooled Neon connection string. The API creates the `scratch_reveals` table automatically on first use.

## Deploy target

GitHub Pages cannot run this API. Use a service that can run Node, such as Render, Railway, Fly.io, or Vercel with a server adapter.

For a plain Node host:

```bash
npm install
npm run build
npm start
```

The backend serves both `/api/*` and the built React app from `dist`.

## Link behavior

- Customer URL: `/?r=<reveal-id>`
- Private manage URL: `/?manage=<reveal-id>&token=<private-token>`

Use the private manage URL to switch the customer page on or off after it has been shared.
