import { createServerFn } from "@tanstack/react-start";
import type { NotifyKind } from "@/lib/notifyTypes";

/** Czy serwer umie wysyłać powiadomienia + publiczny klucz VAPID */
export const getPushStatus = createServerFn({ method: "POST" })
  .validator((data: Record<string, never>) => data)
  .handler(async () => {
    const { pushConfigured } = await import("@/lib/push.server");
    const publicKey = (
      process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY
    )?.trim();
    return { configured: pushConfigured(), publicKey: publicKey ?? null };
  });

/** Zdarzenie w mieszkaniu → powiadomienia dla pozostałych domowników */
export const notifyEvent = createServerFn({ method: "POST" })
  .validator(
    (data: {
      idToken?: string | null;
      householdId: string;
      kind: NotifyKind;
      refId: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { notifyImpl } = await import("@/lib/push.server");
    return notifyImpl(data);
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .validator((data: { idToken?: string | null }) => data)
  .handler(async ({ data }) => {
    const { testPushImpl } = await import("@/lib/push.server");
    return testPushImpl(data.idToken);
  });
