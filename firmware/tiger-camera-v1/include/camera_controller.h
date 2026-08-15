#pragma once

#include "esp_camera.h"

class CameraController {
 public:
  bool begin();
  camera_fb_t* acquireFrame();
  void releaseFrame(camera_fb_t* frame);
  bool setFrameSize(framesize_t size);
  void flushFrames(unsigned char count);
};

