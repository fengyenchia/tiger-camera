# Project Status

Last updated: 2026-08-02

## Current state

Planning complete. No hardware has been purchased or tested and no production
firmware, website or enclosure CAD has been implemented.

## Locked V1 decisions

- Controller: XIAO ESP32S3 Sense
- Display: square 1.3-inch 240 × 240 ST7789, no touch
- The display sits inside a tiger-mouth-shaped opening
- Capture format: original JPEG
- High-quality retro processing: phone browser using Canvas
- Storage: the Sense board's onboard microSD slot
- Capture feedback: review image plus one random on-screen phrase; no audio hardware
- Transfer: camera-created Wi-Fi and an offline local website
- GIF: future backlog, not V1

## Unverified assumptions

- Exact Sense board revision and microSD CS pin
- Actual camera sensor in the purchased batch
- Stability of shared SPI for microSD and ST7789
- Real current draw and runtime with an 800 mAh LiPo
- Captive portal behavior on the target iPhone and Android phones
- Final module and enclosure dimensions

## Next milestone: Phase 0

- [x] Expand the BOM with recommended model/search terms, staged purchase timing,
      Shopee links and arrival checks (prices checked 2026-08-02; not ordered)
- [x] Remove tiger sound, amplifier and speaker from V1; replace capture feedback
      with random review text
- [ ] Purchase the core validation kit
- [ ] Record board, expansion board and camera markings
- [ ] Format a reliable 16 or 32 GB microSD card as FAT32
- [ ] Run the official camera example
- [ ] Run the official microSD example
- [ ] Run the ST7789 example
- [ ] Update `docs/hardware.md` with measured facts

## First blocking gate

Prove that camera capture, onboard microSD writes and ST7789 updates can coexist
for 30 repeated cycles without corrupted files, display artifacts or resets.

If the gate fails, try in order:

1. explicit SPI transactions and separate chip-select handling
2. lower TFT clock and fewer full-screen updates
3. software SPI for the TFT
4. hardware redesign only after the previous options are measured

## Budget

- Core validation kit: approximately NT$839–1,229
- Complete V1 parts: approximately NT$1,100–2,000
- Safer total including shipping, spares and failed prints: NT$1,800–2,800

See `docs/bom.md` and `bom/tiger-camera-v1.csv`.

## Backlog after V1

- long-press animated burst
- phone-side GIF generation
- QR code deep link to a single photo
- stronger per-photo privacy tokens
- OTA firmware updates
- expanded filters and manual adjustments
