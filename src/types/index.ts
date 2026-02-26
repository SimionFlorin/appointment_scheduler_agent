export interface ConversationMessage {
  role: "customer" | "assistant";
  content: string;
  timestamp: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface BusinessHours {
  start: string | null;
  end: string | null;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
