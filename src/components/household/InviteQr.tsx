import { useEffect, useState } from "react";
import { inviteUrl } from "@/lib/inviteLink";

/**
 * Kod QR z linkiem /?join=KOD — skanuje się w aplikacji („Zeskanuj kod QR”)
 * albo zwykłym aparatem telefonu, który od razu otwiera stronę z kodem.
 */
export function InviteQr({ code }: { code: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void import("qrcode")
      .then(({ toDataURL }) =>
        toDataURL(inviteUrl(code), {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        }),
      )
      .then((url) => alive && setSrc(url))
      .catch((err) => console.error("QR render failed:", err));
    return () => {
      alive = false;
    };
  }, [code]);

  if (!src) return <div className="size-40 rounded-2xl bg-muted/40" />;
  return (
    <img
      src={src}
      alt={`Kod QR zaproszenia ${code}`}
      className="size-40 rounded-2xl bg-white p-2"
    />
  );
}
