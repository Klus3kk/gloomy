# <img src="public/logo.png" alt="Gloomy Logo" width="130"/>

Gloomy is a private file delivery. The aim is simple: secure releases and QuickDrop bursts for short-lived sharing.

- Catalogue entries live in Firestore, backed by Firebase Storage and Cloudflare.
- Password prompts hash on the client and every download goes through a signed URL.
- QuickDrop spins up anonymous uploads with one-minute links and QR codes.

## QuickDrop

- Upload anonymously at `/quickdrop`. Files up to 25 MB generate a link that expires in 60 seconds and a QR code for easy device transfers.
- Recipients visit `/quickdrop/<token>` to download once; the link self-destructs immediately after use.
- Storage writes rely on Firebase anonymous auth. Keep Cloudflare rate-limiting/managed challenge enabled on `/quickdrop` routes to mitigate abuse and rely on the built-in per-IP throttle for additional protection.
- Unclaimed QuickDrop uploads auto-expire after 10 minutes and are purged from storage.

## Documentation

Extended documentation lives in `docs/`:.
