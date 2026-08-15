# Project Status

Last updated: 2026-08-16

## Current state

Planning has been reconciled around a local camera, public gallery and private underlying storage design.
The core ESP32-S3-CAM, OV2640 and ST7735 hardware has arrived. The user recorded
the actual markings, independently ran the camera and display examples, connected
the ESP32 to a 2.4 GHz hotspot／Wi-Fi, and measured 16,777,216-byte Flash plus
8,388,608-byte PSRAM. The formal `firmware/tiger-camera-v1/` Gate H1 PlatformIO
project now implements camera／display coexistence, shutter debounce, an owned
latest-JPEG PSRAM buffer and post-capture review. Its PlatformIO production build
passes; physical upload and integration verification remain pending.

The Web code implements the
Gate C0 lifecycle: Device initiate／complete, private R2 objects, Neon metadata,
six-character claims, opaque UUID claim tokens, Canvas finished-image upload,
optional publication, public reading, Admin JWT, device revocation, one-click
permanent deletion and cleanup. `/admin` provides the administrator UI. Neon and
R2 have been configured sufficiently for the user to report that all implemented
API endpoints passed the development test flow. Production deployment／DNS and direct
recording of every cleanup object-state assertion remain pending. IndexedDB retry
remains pending.
The Web code is now a pnpm workspace with independently deployable
`web/frontend/` and `web/backend/` Next.js projects; the existing Vercel project
still needs its Root Directory changed, and the Backend Vercel project is not yet created.

The Frontend now uses route-local `app/<route>/_components/` folders, shared
shadcn-style primitives under `components/ui/`, five base color tokens, two
radius tokens, Noto Sans TC body text and Chiron GoRound TC titles. The `/create`
processing panel has its own desktop scrollbar. Checkbox, radio and filter
controls use local shadcn-style Radix primitives; the timestamp only has an
on/off control and automatically uses the captured time.

On 2026-08-15, the complete Web workspace passed Frontend／Backend ESLint,
TypeScript checks and both Next.js production builds. No standalone format or
test script exists yet.

The Backend generates OpenAPI 3.0.3 from Route Handler JSDoc with
`next-swagger-doc`, serves Swagger UI through `swagger-ui-dist` at `/api/docs`
and exposes `/api/openapi`. Server modules for Neon, R2, device／claim／admin auth,
drafts, photos and validation are implemented. The intended production Backend
origin is `https://api.tiger-camera.fengyenchia.com`; DNS, migration, credentials,
production deployment and DNS verification are still pending.

## Locked V1 decisions

- Controller: AroundTW／GOOUUU ESP32-S3-CAM with ESP32-S3-WROOM-1-N16R8 and OV2640
- Display candidate: 1.44-inch 128 × 128 or 1.8-inch 128 × 160 ST7735 SPI
- Enclosure: basic rectangular camera shape; no tiger-head geometry
- Capture format: original JPEG
- High-quality retro processing: phone Canvas with independently selectable Polaroid frame, captured-time timestamp, text and retro filter; the time is not manually editable and all effects may be disabled
- Storage: one latest JPEG copied to owned PSRAM and replaced by the next successful capture; volatile across power loss
- Capture feedback: review the captured photo without random text or audio hardware
- Connectivity: ESP32 joins a configured 2.4 GHz phone hotspot or trusted Wi-Fi; V1 does not use a camera AP, captive portal or local photo website
- Transfer: ESP32 uploads the original JPEG as a private draft, receives a short claim code and shows it on the ST7735
- NFC: passive tag fixed to `https://tiger-camera.fengyenchia.com/create`; it does not contain the per-photo claim code
- Hosted site: `https://tiger-camera.fengyenchia.com`
- Cloud storage: original JPEG is a private temporary R2 draft; only the finished JPEG remains permanently after publication
- Photo metadata: Neon Serverless PostgreSQL
- Gallery: public list and photo reading; a valid claim holder may publish only the claimed photo, while one administrator can perform one-click permanent deletion; no V1 trash or restore
- Web architecture: two independently deployable Next.js projects. `web/frontend/` contains pages, Canvas and the Axios layer; `web/backend/` contains Route Handlers, CORS and server-only R2／Neon／authentication code
- Draft pairing: each photo receives a UNIQUE six-character plaintext code for 24 hours; first claim clears the code and returns a database-backed opaque UUID Bearer token. Guessing another code is an accepted V1 tradeoff, so there is no HMAC, claim JWT or claim-code rate limit
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

## Measured hardware facts

- 2026-08-16 firmware reading: Flash 16,777,216 bytes (16 MB)
- 2026-08-16 firmware reading: PSRAM enabled, total 8,388,608 bytes (8 MB),
  initially available 8,384,788 bytes
- Actual PCB, ESP32-S3-WROOM-1-N16R8 and OV2640 markings recorded
- Camera and ST7735 examples run successfully as separate sketches
- ESP32 connects to the tested 2.4 GHz hotspot／Wi-Fi

## Unverified assumptions

- Whether both OTG and TTL USB-C programming paths work with the pinned toolchain
- Whether the separate battery module supports safe simultaneous charge and
  discharge, and whether its charge current is suitable for the selected cell
- GPIO47／21／14 with ST7735 and GPIO1 shutter stability
- Real current draw and runtime with an 800 mAh LiPo
- Stability of the selected phone hotspot, its 2.4 GHz compatibility and background timeout behavior
- Real mobile experience of the locked 6-character／24-hour pairing code and daily Hobby cleanup interval
- DNS, Vercel hosting, Cloudflare R2, Neon PostgreSQL and authentication setup for
  `tiger-camera.fengyenchia.com`
- Final module and simple enclosure dimensions

## Gate C0 cloud photo lifecycle

- [x] Create the hosted Next.js skeleton in `web/`
- [x] Split the Web workspace into `web/frontend/` and `web/backend/`
- [x] Create the original Vercel project
- [ ] Change the original Vercel project's Root Directory to `web/frontend`
- [ ] Create the Backend Vercel project with Root Directory `web/backend`
- [ ] Deploy both projects, connect `tiger-camera.fengyenchia.com` to Frontend and `api.tiger-camera.fengyenchia.com` to Backend, then configure the Backend API URL／CORS origin
- [x] Configure a private Cloudflare R2 bucket and Neon PostgreSQL database for development testing
- [x] Implement revocable device credentials and `device initiate → original PUT → complete`
- [x] Implement UNIQUE six-character plaintext pairing codes, 24-hour expiry, atomic first claim and draft-scoped opaque UUID tokens
- [x] Replace the `TIGER1` Demo routes with private original read and processed upload／publish code
- [x] Add one-administrator authentication using a short-lived JWT stored in localStorage and sent explicitly as an `Authorization: Bearer` header
- [x] Implement claim-holder finished-image download／optional publish and `/admin`
- [x] Implement gallery and one-click permanent deletion against Neon／R2
- [x] Exercise all implemented API endpoints in the user-run development test flow
- [x] Implement expiry cleanup for uploading, ready and claimed drafts plus post-publish original cleanup
- [x] Execute Neon migration, configure R2 CORS／credentials, and test every implemented API
- [ ] Verify publication removes the temporary original and permanent deletion removes the finished object and metadata

## Current milestone: Gate H0／H1 hardware integration

- [x] Expand the BOM with recommended model/search terms, staged purchase timing,
      Shopee links and arrival checks (prices checked 2026-08-11; not ordered)
- [x] Remove tiger sound, amplifier, speaker and random on-screen phrases from V1;
      capture feedback is the photo review itself
- [x] Confirm the ESP32-S3-CAM N16R8＋OV2640 option and seller pinout
- [ ] Ask whether the separate battery board supports load sharing and adjustable charge current
- [x] Purchase the core validation kit
- [x] Record delivered PCB, N16R8 and OV2640 markings
- [x] Run the official camera example
- [x] Run the ST7735 example
- [x] Confirm 16 MB Flash and 8 MB PSRAM from firmware readings
- [x] Confirm connection to a 2.4 GHz hotspot／Wi-Fi
- [x] Create the formal `firmware/tiger-camera-v1/` Gate H1 implementation
- [x] Build the PlatformIO project with the project-local N16R8 board definition
- [ ] Upload the PlatformIO project to the physical board
- [ ] Verify Camera＋ST7735＋GPIO1 shutter＋PSRAM coexistence on hardware
- [ ] Complete 10 cold boots and 30 repeated captures
- [x] Update `docs/hardware.md` with measured facts

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
