import { createWorkersResponseStoreServiceBindingConfig } from "@vinext/cloudflare/cache/config";
import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

const responseStore = await createWorkersResponseStoreServiceBindingConfig({
  worker: {
    name: "nego-response-store",
    compatibilityDate: "2026-11-18",
  },
  bucket: "nego-response-store-cache-bodies",
});

export const responseStoreServiceBinding = responseStore.serviceBindingWorker;

export default defineConfig({
  worker: defineWorker({
    ...responseStore.applicationWorker,
    name: "nego",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-11-18",
    domains: ["www.negoempire.live", "negoempire.live"],
    triggers: [
      triggers.scheduled({ schedule: "0 0 * * *" }),
      triggers.scheduled({ schedule: "0 9 * * 1" }),
    ],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ...responseStore.applicationWorker.env,
      ASSETS: bindings.assets(),
      MEDIA_BUCKET: bindings.r2({ name: "nego-media" }),
    },
  }),
});
