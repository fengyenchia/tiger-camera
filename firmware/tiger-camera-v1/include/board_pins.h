#pragma once

namespace BoardPins {

// AroundTW / GOOUUU ESP32-S3-CAM camera routing confirmed by the seller pinout
// and the working ESP32S3_EYE CameraWebServer example.
constexpr int cameraPowerDown = -1;
constexpr int cameraReset = -1;
constexpr int cameraXclk = 15;
constexpr int cameraSiod = 4;
constexpr int cameraSioc = 5;
constexpr int cameraY2 = 11;
constexpr int cameraY3 = 9;
constexpr int cameraY4 = 8;
constexpr int cameraY5 = 10;
constexpr int cameraY6 = 12;
constexpr int cameraY7 = 18;
constexpr int cameraY8 = 17;
constexpr int cameraY9 = 16;
constexpr int cameraVsync = 6;
constexpr int cameraHref = 7;
constexpr int cameraPclk = 13;

// Confirmed working ST7735 software-SPI wiring.
constexpr int tftChipSelect = -1;  // TFT CS is tied to GND.
constexpr int tftReset = -1;       // TFT RST is tied to board RST.
constexpr int tftDataCommand = 14;
constexpr int tftMosi = 21;
constexpr int tftClock = 47;

// Gate H1 candidate. Button connects GPIO1 to GND and uses INPUT_PULLUP.
constexpr int shutter = 1;

// P0.1 battery divider input. GPIO3 is ADC1_CH2 and is physically exposed on
// the tested board. It is also a strapping pin, so it must only ever see the
// high-impedance 100k/100k divider described in docs/power-assembly-guide.md.
// Do not connect the LiPo directly to this pin.
constexpr int batterySense = 3;

}  // namespace BoardPins
