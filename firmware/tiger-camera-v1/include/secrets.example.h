#pragma once

// Copy this file to secrets.h and fill it in. Never commit secrets.h.
constexpr char wifiSsid[] = "YOUR_2_4_GHZ_WIFI";
constexpr char wifiPassword[] = "YOUR_WIFI_PASSWORD";
constexpr char apiBaseUrl[] = "https://api.tiger-camera.fengyenchia.com/api";
constexpr char deviceCredential[] = "YOUR_DEVICE_CREDENTIAL";

// Paste the PEM root CA certificate(s) that validate apiBaseUrl. Do not paste a
// website/leaf certificate. Cloudflare R2 uses its separately versioned public
// trust anchor in r2_root_ca.h.
constexpr char tlsRootCaPem[] = R"PEM(
PASTE_ROOT_CA_CERTIFICATES_HERE
)PEM";
