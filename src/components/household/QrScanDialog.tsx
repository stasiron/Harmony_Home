import { useEffect, useRef, useState } from "react";
import { CameraOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { inviteCodeFromScan } from "@/lib/inviteLink";

type Detect = (source: HTMLVideoElement) => Promise<string | null>;

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

/** BarcodeDetector (Chrome, Android) albo jsQR (Safari, Firefox) */
async function createDetector(): Promise<Detect> {
  const Native = (
    window as unknown as {
      BarcodeDetector?: new (opts: {
        formats: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (Native) {
    const detector = new Native({ formats: ["qr_code"] });
    return async (video) => (await detector.detect(video))[0]?.rawValue ?? null;
  }

  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    const scale = Math.min(1, 640 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return jsQR(frame.data, frame.width, frame.height)?.data ?? null;
  };
}

function Scanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Ta przeglądarka nie daje dostępu do aparatu.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        setError("Brak dostępu do aparatu — zezwól na niego w przeglądarce.");
        return;
      }
      if (stopped) return;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      const detect = await createDetector();
      const tick = async () => {
        if (stopped) return;
        const text = await detect(video).catch(() => null);
        if (text) {
          const code = inviteCodeFromScan(text);
          if (code) {
            onCodeRef.current(code);
            return;
          }
          setHint("To nie jest kod zaproszenia HomeHarmony.");
        }
        timer = setTimeout(() => void tick(), 250);
      };
      void tick();
    };

    void start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/40 px-6 py-10 text-center">
        <CameraOff className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <p className="text-xs text-muted-foreground">
          Możesz też zeskanować kod zwykłym aparatem telefonu albo wpisać go
          ręcznie.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-[18%] rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {hint ?? "Skieruj aparat na kod QR z ustawień mieszkania."}
      </p>
    </div>
  );
}

export function QrScanDialog({
  open,
  onOpenChange,
  onCode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCode: (code: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zeskanuj kod QR</DialogTitle>
          <DialogDescription>
            Kod pokazuje administrator w Ustawieniach → Mieszkanie.
          </DialogDescription>
        </DialogHeader>
        {open && <Scanner onCode={onCode} />}
      </DialogContent>
    </Dialog>
  );
}
