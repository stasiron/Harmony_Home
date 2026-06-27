export type Status = "safe" | "suggested" | "must" | "done";

export type ChoreRoom =
  | "living"
  | "dining"
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "bedroom2"
  | "hallway"
  | "whole";

export type MapPin = { x: number; y: number };

export type TaskRecurrence = "once" | "recurring";

export type TaskSource = "builtin" | "user";

export interface User {
  id: string;
  name: string;
  avatar: string; // emoji or initial — easy to swap for image url
  color: string; // tailwind-compatible token (e.g. "chart-1")
  active: boolean;
  heavyDay: boolean;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  room: ChoreRoom;
  category: "kitchen" | "bathroom" | "living" | "bedroom" | "outdoor" | "general";
  estimatedMinutes: number;
  /** User.id — puste = nikt nie przypisany */
  assignedTo: string;
  mapPins?: MapPin[];
  recurrence: TaskRecurrence;
  source: TaskSource;
  /** ISO date string of last completion */
  lastCompleted: string;
  /** earliest you'd consider doing it again */
  tMin: number;
  /** start nagging gently */
  tSuggested: number;
  /** hard deadline → red alert */
  tMax: number;
  isGuestPriority: boolean;
  isExpressBlitz: boolean;
  smartDeviceId?: string;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  timeMinutes: number;
  ingredients: { name: string; category: ShoppingCategory; qty: string }[];
}

export type ShoppingCategory =
  | "produce"
  | "dairy"
  | "bakery"
  | "pantry"
  | "frozen"
  | "household";

export interface ShoppingItem {
  id: string;
  name: string;
  category: ShoppingCategory;
  qty: string;
  checked: boolean;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  room: string;
  type: "vacuum" | "washer" | "dryer" | "dishwasher" | "sensor";
  triggered: boolean;
  /** task id that this device auto-completes / generates */
  linkedTaskId?: string;
  /** if set, when triggered, generates a new high-priority task with this name */
  generatesTask?: string;
}

export interface GuestPlan {
  id: string;
  when: string; // ISO
  notes: string;
}

export interface PanicState {
  active: boolean;
  minutes: 15 | 30 | 45;
  startedAt: string; // ISO
}
