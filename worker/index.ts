import handler from "vinext/server/fetch-handler";

export * from "vinext/server/fetch-handler";

interface ScheduledControllerLike {
  cron: string;
  scheduledTime: number;
  noRetry(): void;
}

interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface WorkerEnvLike {
  CRON_SECRET?: string;
  NEXT_PUBLIC_APP_URL?: string;
  [key: string]: unknown;
}

interface VinextFetchHandler {
  fetch(
    request: Request,
    env?: unknown,
    ctx?: unknown
  ): Promise<Response> | Response;
}

const vinextHandler = handler as unknown as VinextFetchHandler;

const CRON_ROUTES: Record<string, string> = {
  "0 0 * * *": "/api/bookings/expire",
  "0 9 * * 1": "/api/admin/digest",
};

const worker = {
  fetch(request: Request, env: WorkerEnvLike, ctx: ExecutionContextLike) {
    return vinextHandler.fetch(request, env, ctx);
  },

  async scheduled(
    controller: ScheduledControllerLike,
    env: WorkerEnvLike,
    ctx: ExecutionContextLike
  ) {
    const pathname = CRON_ROUTES[controller.cron];
    if (!pathname) {
      console.warn(`[Cron] No route mapped for schedule "${controller.cron}"`);
      return;
    }

    const baseUrl = (env.NEXT_PUBLIC_APP_URL || "https://www.negoempire.live").replace(/\/+$/, "");
    const headers = new Headers({
      "user-agent": "cloudflare-cron-trigger",
    });
    if (env.CRON_SECRET) {
      headers.set("authorization", `Bearer ${env.CRON_SECRET}`);
    }

    const request = new Request(`${baseUrl}${pathname}`, {
      method: "POST",
      headers,
    });

    const response = await vinextHandler.fetch(request, env, ctx);
    const body = await response.text();
    if (!response.ok) {
      console.error(`[Cron] ${pathname} failed (${response.status}): ${body}`);
      throw new Error(`Cron ${pathname} failed with status ${response.status}`);
    }

    console.log(`[Cron] ${pathname} completed (${response.status}): ${body}`);
  },
};

export default worker;
