# Project Status

Last updated: 2026-08-12

## Current state

Planning has been reconciled around a local-camera plus private-cloud design.
No hardware has been purchased or tested and no production firmware, deployed
website or enclosure CAD has been implemented. A local Next.js gallery prototype
now covers a separate home page, JPEG import, gallery and one-click direct deletion
with an in-memory demo API; authentication and persistent storage remain pending.

## Locked V1 decisions

- Controller: AroundTW／GOOUUU ESP32-S3-CAM with ESP32-S3-WROOM-1-N16R8 and OV2640
- Display candidate: 1.44-inch 128 × 128 or 1.8-inch 128 × 160 ST7735 SPI
- Enclosure: basic rectangular camera shape; no tiger-head geometry
- Capture format: original JPEG
- High-quality retro processing: phone browser using Canvas, with capture date and a Polaroid-style border
- Storage: latest JPEG copied to owned PSRAM; volatile across power loss
- Capture feedback: review image plus one random on-screen phrase; no audio hardware
- Transfer: passive NFC URL plus camera-created Wi-Fi and an offline local website
- Hosted site: `https://tiger-camera.fengyenchia.com`
- Cloud storage: separate immutable original and processed JPEG objects
- Gallery: one authenticated administrator with list and one-click permanent deletion; no V1 trash or restore
- Web architecture: one full-stack Next.js application; `web/api/` is the browser Axios layer, while `web/app/api/` and `web/lib/server/` are the server side. Split only for independent deployment, long-running background work or multiple clients
- Offline fallback: browser retry queue or explicit phone download; never claim a failed upload succeeded
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
- Captive portal behavior on the target iPhone and Android phones
- Local Network Access behavior when the public HTTPS site reads the camera's
  HTTP endpoint; manual file import remains the required fallback
- DNS, hosting, private object storage, database and authentication setup for
  `tiger-camera.fengyenchia.com`
- Final module and simple enclosure dimensions

## Next milestone: Gate C0 cloud photo lifecycle

- [x] Create the hosted Next.js skeleton in `web/`
- [x] Create the Vercel project; Git deployment and domain connection remain pending
- [ ] Deploy it and connect `tiger-camera.fengyenchia.com`
- [ ] Configure private object storage and a photo metadata database
- [ ] Add one-administrator authentication
- [ ] Upload separate original and processed test JPEGs with short-lived URLs
- [ ] Implement gallery and one-click permanent deletion against real storage
- [ ] Verify unauthenticated users cannot list or read photos
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
