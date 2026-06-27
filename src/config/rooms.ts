import type { ChoreRoom } from "@/types";

export const ROOM_OPTIONS: { value: ChoreRoom; label: string }[] = [
  { value: "living", label: "Salon" },
  { value: "dining", label: "Jadalnia" },
  { value: "kitchen", label: "Kuchnia" },
  { value: "bathroom", label: "Łazienka" },
  { value: "bedroom", label: "Sypialnia" },
  { value: "bedroom2", label: "Sypialnia 2" },
  { value: "hallway", label: "Przedpokój" },
  { value: "whole", label: "Cały dom" },
];

/** Pozycja pinezki na planie (% od lewego górnego rogu). */
export const ROOM_PIN_POSITIONS: Record<ChoreRoom, { x: number; y: number }> = {
  living: { x: 20, y: 24 },
  dining: { x: 20, y: 74 },
  kitchen: { x: 44, y: 80 },
  bathroom: { x: 44, y: 24 },
  bedroom: { x: 82, y: 24 },
  bedroom2: { x: 82, y: 74 },
  hallway: { x: 52, y: 50 },
  whole: { x: 50, y: 50 },
};

export function roomLabel(room: ChoreRoom): string {
  return ROOM_OPTIONS.find((r) => r.value === room)?.label ?? room;
}

export function pinForRoom(room: ChoreRoom, index: number, total: number) {
  const base = ROOM_PIN_POSITIONS[room];
  if (total <= 1) return base;
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = 2.8;
  return {
    x: base.x + Math.cos(angle) * radius,
    y: base.y + Math.sin(angle) * radius,
  };
}
