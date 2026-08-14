# Project Status

Last updated: 2026-08-14

## Current state

Planning has been reconciled around a local camera, public gallery and private underlying storage design.
No hardware has been purchased or tested and no production firmware, deployed
website or enclosure CAD has been implemented. A local Next.js prototype now
covers a separate home page, `/create` claim-code Demo, selectable Canvas
processing, downloads, optional Demo publishing and a public gallery. The
unauthenticated Demo delete control was removed until administrator
authentication exists. Device authentication, real claim lifecycle, administrator
authentication, IndexedDB and persistent R2／Neon storage remain pending.
The Web code is now a pnpm workspace with independently deployable
`web/frontend/` and `web/backend/` Next.js projects; the existing Vercel project
still needs its Root Directory changed, and the Backend Vercel project is not yet created.

## Locked V1 decisions

- Controller: AroundTW／GOOUUU ESP32-S3-CAM with ESP32-S3-WROOM-1-N16R8 and OV2640
- Display candidate: 1.44-inch 128 × 128 or 1.8-inch 128 × 160 ST7735 SPI
- Enclosure: basic rectangular camera shape; no tiger-head geometry
- Capture format: original JPEG
- High-quality retro processing: phone Canvas with independently selectable Polaroid frame, timestamp, text and retro filter; all effects may be disabled
- Storage: latest JPEG copied to owned PSRAM; volatile across power loss
- Capture feedback: review image plus one random on-screen phrase; no audio hardware
- Connectivity: ESP32 joins a configured 2.4 GHz phone hotspot or trusted Wi-Fi; V1 does not use a camera AP, captive portal or local photo website
- Transfer: ESP32 uploads the original JPEG as a private draft, receives a short claim code and shows it on the ST7735
- NFC: passive tag fixed to `https://tiger-camera.fengyenchia.com/create`; it does not contain the per-photo claim code
- Hosted site: `https://tiger-camera.fengyenchia.com`
- Cloud storage: separate immutable original and processed JPEG objects in a private Cloudflare R2 bucket
- Photo metadata: Neon Serverless PostgreSQL
- Gallery: public list and photo reading; a valid claim holder may publish only the claimed photo, while one administrator can perform one-click permanent deletion; no V1 trash or restore
- Web architecture: two independently deployable Next.js projects. `web/frontend/` contains pages, Canvas and the Axios layer; `web/backend/` contains Route Handlers, CORS and server-only R2／Neon／authentication code
- Draft security: claim code is short-lived and exchanged for a short-lived, photo-scoped claim token; the raw code is not a permanent credential
- Publishing choice: processing and downloads happen on the claimant's phone; a draft reaches the public gallery only when that claim holder explicitly publishes it
- microSD: optional future device-local persistence, not required for cloud persistence
- GIF: future backlog, not V1

## Seller-stated module details

- ESP32-S3-WROOM-1-N16R8: 16 MB Flash and 8 MB Octal PSRAM
- OV2640 camera option selected; seller pinout reserves GPIO4–13 and GPIO15–18
- Two onboard USB-C connectors are labelled OTG and TTL
- GPIO35–37 are marked for PSRAM, GPIO38–40 for SD and GPIO19–20 for USB
- The board does not advertise LiPo charging; the separate DIY 5 V 2 A／2.4 A
  lithium module remains the battery candidate

## Unverified assumptions

- Actual delivered PCB revision and whether both OTG and TTL USB-C programming
  paths work with the pinned toolchain
- Whether the separate battery module supports safe simultaneous charge and
  discharge, and whether its charge current is suitable for the selected cell
- Actual N16R8 and OV2640 markings
- GPIO47／21／14 with ST7735 and GPIO1 shutter stability
- Real current draw and runtime with an 800 mAh LiPo
- Stability of the selected phone hotspot, its 2.4 GHz compatibility and background timeout behavior
- Final claim-code length, expiry, retry limits and cleanup interval after real mobile testing
- DNS, Vercel hosting, Cloudflare R2, Neon PostgreSQL and authentication setup for
  `tiger-camera.fengyenchia.com`
- Final module and simple enclosure dimensions

## Next milestone: Gate C0 cloud photo lifecycle

- [x] Create the hosted Next.js skeleton in `web/`
- [x] Split the Web workspace into `web/frontend/` and `web/backend/`
- [x] Create the original Vercel project
- [ ] Change the original Vercel project's Root Directory to `web/frontend`
- [ ] Create the Backend Vercel project with Root Directory `web/backend`
- [ ] Deploy both projects, connect `tiger-camera.fengyenchia.com` to Frontend and configure the Backend API URL／CORS origin
- [ ] Configure a private Cloudflare R2 bucket and Neon PostgreSQL database
- [ ] Add revocable device credentials and simulate `device initiate → original PUT → complete`
- [ ] Add expiring claim codes, HMAC lookup, rate limiting and photo-scoped claim tokens
- [ ] Replace the `TIGER1` Demo with private original read and processed upload／publish
- [ ] Add one-administrator authentication using a short-lived JWT stored in localStorage and sent explicitly as an `Authorization: Bearer` header
- [ ] Verify a claim holder can download or publish only the claimed photo without an admin account
- [ ] Implement gallery and one-click permanent deletion against real storage
- [ ] Verify everyone can list active photos, while drafts remain private and only admins can delete
- [ ] Implement expiry cleanup for uploading, ready and claimed drafts
- [ ] Verify permanent deletion removes both objects and metadata

## Hardware milestone after Gate C0

- [x] Expand the BOM with recommended model/search terms, staged purchase timing,
      Shopee links and arrival checks (prices checked 2026-08-11; not ordered)
- [x] Remove tiger sound, amplifier and speaker from V1; replace capture feedback
      with random review text
- [x] Confirm the ESP32-S3-CAM N16R8＋OV2640 option and seller pinout
- [ ] Ask whether the separate battery board supports load sharing and adjustable charge current
- [ ] Purchase the core validation kit only after those options are confirmed
- [ ] Record delivered PCB, N16R8 and OV2640 markings
- [ ] Run the official camera example
- [ ] Run the ST7735 example
- [ ] Update `docs/hardware.md` with measured facts

## First blocking hardware gate

Prove that camera capture, ST7735 updates, shutter input and copying the latest
JPEG into owned PSRAM can coexist for 30 repeated cycles without corrupted
images, display artifacts or resets.

If the gate fails, try in order:

1. verify the seller pinout and avoid boot, USB, PSRAM, SD and camera pins
2. lower TFT clock and reduce full-screen updates
3. tie TFT reset to board reset or use a no-CS configuration to save GPIO
4. restore microSD only after the minimal configuration passes

## Budget

- Core validation kit: approximately NT$650–900
- Complete V1 parts: approximately NT$1,450–2,100
- Safer total including shipping, spares and failed prints: NT$1,800–2,600

See `docs/bom.md` and `bom/tiger-camera-v1.csv`.

## Backlog after V1

- long-press animated burst
- phone-side GIF generation
- stronger per-photo privacy tokens
- OTA firmware updates
- expanded filters and manual adjustments
- optional microSD device-local persistence and offline metadata
