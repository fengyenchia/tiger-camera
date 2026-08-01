# Tiger Camera repository guidance

## Project goal

Build a small tiger-head toy camera around Seeed Studio XIAO ESP32S3 Sense.

- The square 1.3-inch ST7789 display is visually framed as the tiger's mouth.
- A short shutter press captures and stores a JPEG, then reviews it with one
  random on-screen tiger phrase.
- The ESP32 serves an offline local website over its own Wi-Fi.
- The phone website performs the high-quality retro processing and JPEG export.

## Current scope

The repository is in planning state. Implement V1 only.

V1 includes:

- live camera preview
- short-press JPEG capture
- microSD storage and JSON metadata
- post-capture review
- post-capture review with five random on-screen tiger phrases
- battery and charging states
- Wi-Fi AP, captive portal, mDNS and fallback IP
- local photo gallery and Canvas-based retro processing
- downloadable original and processed JPEGs
- 3D-printable tiger-head enclosure

Do not implement GIF, video, cloud accounts, Bluetooth photo transfer, a native
mobile app, AI filters or automatic social upload unless the user explicitly
moves them into scope. GIF remains a documented future feature.

## Read before changing

Start with:

1. `README.md`
2. `PROJECT_STATUS.md`
3. `docs/product-plan.md`
4. `docs/hardware.md`
5. the document for the area being changed

Hardware assumptions in planning documents are not measurements. Record the
actual board revision, camera sensor and module dimensions before locking pins
or enclosure geometry.

## Implementation order

Follow the gates in `docs/development-roadmap.md`.

The first technical gate is camera + onboard microSD + ST7789 coexistence.
Do not begin detailed enclosure work before that gate passes.

## Repository areas

- `firmware/`: PlatformIO-managed Arduino-ESP32 firmware
- `web/`: TypeScript static web app and Canvas processing
- `enclosure/`: CAD, measured dimensions and printable exports
- `assets/`: licensed icons, frames and fonts
- `docs/`: product, hardware, software, roadmap and tests
- `bom/`: machine-readable bill of materials

## Engineering rules

- Preserve original JPEG files. Processed images must not overwrite originals.
- Stream photos from storage; do not assume a full-resolution JPEG fits in RAM.
- Serialize SD and TFT access when they share the SPI bus.
- Use atomic temp-write + rename for photos and metadata.
- Treat Wi-Fi failure as non-fatal to the core camera.
- Keep secrets, real Wi-Fi passwords and admin PINs out of Git.
- Do not commit unlicensed fonts, graphics or third-party 3D assets.
- Update relevant docs and `PROJECT_STATUS.md` when a hardware assumption is
  confirmed or rejected.

## Verification

When firmware exists:

- build it with the pinned PlatformIO environment
- run available unit tests
- report any test requiring physical hardware as not run

When the web app exists:

- run formatting, type checking, tests and production build
- test processed-image output with landscape and portrait fixtures

For hardware milestones, use `docs/test-plan.md`. Never claim a physical test
passed without results from the actual device.

## Change discipline

- Keep changes scoped to one roadmap milestone when possible.
- State which decision gate the change advances.
- Do not silently replace a chosen part because a library example is easier.
- Record blockers and next actions in `PROJECT_STATUS.md`.
