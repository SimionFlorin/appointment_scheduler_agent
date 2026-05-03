export interface ConversationMessage {
  role: "customer" | "assistant";
  content: string;
  timestamp: string;
  /**
   * True when the assistant message was sent manually by the business owner
   * (not by the AI). Optional for backwards compatibility with existing rows.
   */
  manual?: boolean;
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
