# CineStream Real

Lumiere is a movie and series discovery app powered by TMDB metadata and an external CineSrc player embed.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cinova.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d69858ed-2554-46ae-95a7-9fb6674a80ba).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
```

Create an untracked `.env.local` file in the project root and add your TMDB API key:

```text
TMDB_API_KEY=your_key_from_tmdb
```

Then run `npm run dev`. Keep the key private: do not prefix it with `VITE_`, add it to browser code, or commit it.

## Deploy to Netlify

The included `netlify.toml` selects the Netlify server build and publishes the generated `dist` assets. Connect the repository to Netlify and deploy with the detected package manager; the configured build command is `npm run build:netlify`.

Before deploying, add `TMDB_API_KEY` under **Project configuration → Environment variables** in Netlify. Set it for every deploy context you use (such as production and deploy previews), then redeploy after adding or changing it.

## Deploy to Vercel

Import the repository into Vercel. The included `vercel.json` runs `npm run build:vercel` and uses Nitro's generated `.vercel/output` deployment bundle, including the server runtime needed by TMDB requests.

Before deploying, add `TMDB_API_KEY` under **Project Settings → Environment Variables** in Vercel. Select the environments you use (production, preview, and/or development), then redeploy after adding or changing it.

## Hosting notes

- Keep the app on the configured server-capable build; a static-only export will not run the server-side TMDB requests.
- The TMDB key is read only by server code. It is not included in the browser bundle when configured without a `VITE_` prefix.
- TMDB supplies catalog metadata and artwork. The external player is independently hosted, so its availability and playback behavior are not guaranteed by deploying this app.
- Review TMDB's terms and attribution requirements before publishing.
