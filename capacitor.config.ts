import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.mycellar.app",
  appName: "MyCellar",
  webDir: "artifacts/minha-adega/dist/public",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;
