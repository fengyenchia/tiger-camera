# Tiger Camera repository guidance

## Project goal

Build a compact camera around the AroundTW／GOOUUU ESP32-S3-CAM board using an
ESP32-S3-WROOM-1-N16R8 module and OV2640 camera.

- Use a basic rectangular camera enclosure with a small ST7735 SPI display.
- A short shutter press captures and stores a JPEG, then reviews it with one
  random on-screen tiger phrase.
- The ESP32 serves an offline local website over its own Wi-Fi.
- The phone performs the high-quality retro processing and JPEG export.
- `tiger-camera.fengyenchia.com` provides an authenticated private gallery, permanent
  storage and one-click permanent deletion.

## Current scope

The repository is in planning state. Implement V1 only.

V1 includes:

- live camera preview
- short-press JPEG capture
- one latest JPEG kept temporarily in PSRAM
- post-capture review
- post-capture review with five random on-screen tiger phrases
- battery and charging states
- Wi-Fi AP, captive portal, mDNS and fallback IP
- NFC URL access to the latest photo and Canvas-based retro processing
- downloadable original and processed JPEGs
- authenticated upload of separate original and processed JPEGs
- private cloud gallery with one-click permanent deletion
- simple 3D-printable camera enclosure

Do not implement GIF, video, public registration, multi-user social features,
Bluetooth photo transfer, a native mobile app, AI filters or automatic social
upload unless the user explicitly moves them into scope. V1 has one private
administrator; GIF remains a documented future feature.

## Read before changing

Start with:

1. `docs/START_HERE.md`
2. `README.md`
3. `PROJECT_STATUS.md`
4. `docs/development-roadmap.md`
5. the document for the area being changed

Hardware assumptions in planning documents are not measurements. Record the
actual board revision, camera sensor and module dimensions before locking pins
or enclosure geometry.

## Implementation order

Follow the gates in `docs/START_HERE.md` and `docs/development-roadmap.md`.

The first implementation gate is the authenticated cloud photo lifecycle using
a test JPEG. The first hardware gate is camera + ST7735 + shutter +
latest-JPEG PSRAM buffer coexistence using the seller-provided ESP32-S3-CAM
pinout.
Do not begin detailed enclosure work before that gate passes.

## Repository areas

- `firmware/`: PlatformIO-managed Arduino-ESP32 firmware; its `data/` directory
  contains the minimal local camera page
- `web/`: hosted Next.js app for Canvas processing, private storage and gallery
- `enclosure/`: CAD, measured dimensions and printable exports
- `assets/`: licensed icons, frames and fonts
- `docs/`: product, hardware, software, roadmap and tests
- `bom/`: machine-readable bill of materials

## Engineering rules

- Preserve the latest captured JPEG buffer until the next successful capture.
- Copy the camera framebuffer into owned PSRAM before returning it to the camera
  driver; never retain a returned framebuffer pointer.
- Protect the latest JPEG buffer against concurrent capture and HTTP reads.
- Preserve original and processed JPEGs as separate immutable cloud objects.
- Treat microSD as optional device-local persistence; the private cloud gallery
  and its database metadata are V1 scope.
- Never expose storage credentials, database credentials or long-lived upload
  tokens to the browser or firmware. Use short-lived, path-scoped upload URLs.
- Do not report a photo as permanently saved until both objects and metadata are
  confirmed. Keep a retry or download fallback when internet access is absent.
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
- test authentication, direct upload, gallery listing and one-click permanent
  deletion
- verify unauthenticated users cannot list or read private photos

For hardware milestones, use `docs/test-plan.md`. Never claim a physical test
passed without results from the actual device.

## Change discipline

- Keep changes scoped to one roadmap milestone when possible.
- State which decision gate the change advances.
- Do not silently replace a chosen part because a library example is easier.
- Record blockers and next actions in `PROJECT_STATUS.md`.
