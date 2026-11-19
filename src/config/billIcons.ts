import {
  Building2,
  Car,
  Droplet,
  Dumbbell,
  Flame,
  Home,
  Music,
  Receipt,
  Shield,
  Smartphone,
  Thermometer,
  Trash2,
  Tv,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Ikony rachunków — klucz zapisany w ustawieniach mieszkania */
export const BILL_ICONS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Czynsz", icon: Home },
  { id: "zap", label: "Prąd", icon: Zap },
  { id: "flame", label: "Gaz", icon: Flame },
  { id: "wifi", label: "Internet", icon: Wifi },
  { id: "droplet", label: "Woda", icon: Droplet },
  { id: "thermometer", label: "Ogrzewanie", icon: Thermometer },
  { id: "trash", label: "Śmieci", icon: Trash2 },
  { id: "tv", label: "Telewizja", icon: Tv },
  { id: "music", label: "Muzyka / streaming", icon: Music },
  { id: "phone", label: "Telefon", icon: Smartphone },
  { id: "shield", label: "Ubezpieczenie", icon: Shield },
  { id: "building", label: "Administracja", icon: Building2 },
  { id: "car", label: "Parking / auto", icon: Car },
  { id: "dumbbell", label: "Siłownia", icon: Dumbbell },
  { id: "receipt", label: "Inny", icon: Receipt },
];

export function billIcon(id: string | null | undefined): LucideIcon {
  return BILL_ICONS.find((i) => i.id === id)?.icon ?? Receipt;
}

/** Co ile miesięcy — wybór w ustawieniach */
export const BILL_PERIODS = [
  { months: 1, label: "co miesiąc" },
  { months: 2, label: "co 2 miesiące" },
  { months: 3, label: "co kwartał" },
  { months: 6, label: "co pół roku" },
  { months: 12, label: "co rok" },
] as const;
