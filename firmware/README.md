# Firmware

此目錄保留給 XIAO ESP32S3 Sense 韌體。

開始實作前先完成：

1. 記錄實際板版與相機型號。
2. 獨立跑通官方 camera、microSD、ST7789 範例。
3. 依 [硬體與腳位規劃](../docs/hardware.md) 完成 SPI 共存 Gate。

預計使用 PlatformIO 管理 Arduino-ESP32 專案；實作時再依相容性鎖定套件版本。
