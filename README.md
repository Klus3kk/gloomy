# Gloomy

<img src="public/logo.png" alt="Gloomy Logo" width="75"/>

Gloomy is a private file delivery hub for gloomyclue.com. The aim is simple:
secure releases, QuickDrop bursts for short-lived sharing, and a clean dark UI
that stays out of the way when you’re hunting for a build.

- Catalogue entries live in Firestore, backed by Firebase Storage and Cloudflare.
- Password prompts hash on the client and every download goes through a signed URL.
- QuickDrop spins up anonymous uploads with one-minute links and QR codes.

## Testing & Security

- Run unit tests via:

  ```bash
  npm run test
  ```

  This compiles TypeScript sources into `.tmp-tests` and executes Node's built-in test runner.

- Run Snyk vulnerability checks:

  ```bash
  npm run security:snyk
  ```

  Authenticate with `snyk auth` beforehand. The CLI is declared as a dev dependency; install it with `npm install` if it is not present locally.

## QuickDrop

- Upload anonymously at `/quickdrop`. Files up to 25 MB generate a link that expires in 60 seconds and a QR code for easy device transfers.
- Recipients visit `/quickdrop/<token>` to download once; the link self-destructs immediately after use.
- Storage writes rely on Firebase anonymous auth. Keep Cloudflare rate-limiting/managed challenge enabled on `/quickdrop` routes to mitigate abuse.
