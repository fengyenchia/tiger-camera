#include <WiFi.h>

// 填入你的手機熱點名稱與密碼
const char* ssid     = "帳號";
const char* password = "密碼";

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.print("正在連線至熱點: ");
  Serial.println(ssid);

  // 設定為 Station 模式並開始連線
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  // 等待連線
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    retryCount++;
    if (retryCount > 40) { // 超過 20 秒未連上
      Serial.println("\n連線逾時，請檢查熱點名稱、密碼或 2.4GHz 設定！");
      return;
    }
  }

  // 連線成功
  Serial.println();
  Serial.println("Wi-Fi 連線成功！");
  Serial.print("ESP32 取得的 IP 位址: ");
  Serial.println(WiFi.localIP());
  Serial.print("訊號強度 (RSSI): ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

void loop() {
  // 維持連線，若斷線可在此做自動重連
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi 斷線，嘗試重新連線...");
    WiFi.disconnect();
    WiFi.reconnect();
    delay(5000);
  }
}