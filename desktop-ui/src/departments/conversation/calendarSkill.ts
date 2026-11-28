/**
 * Google Calendar & Schedule Skill (<75 lines)
 * Manages schedule events, appointments, and daily briefing integration.
 */
import type { SkillReply } from "./assistantSkills.ts";
import { getSlots } from "./conversationMemory.ts";

export interface CalendarEvent {
  summary: string;
  time: string;
}

const CALENDAR_STORAGE_KEY = "friday_calendar_events_v1";

let memEvents: CalendarEvent[] = [];

export function loadCalendarEvents(): CalendarEvent[] {
  if (typeof localStorage === "undefined") return memEvents;
  try {
    return JSON.parse(localStorage.getItem(CALENDAR_STORAGE_KEY) ?? "[]");
  } catch {
    return memEvents;
  }
}

export function saveCalendarEvent(summary: string, time: string): void {
  const events = loadCalendarEvents();
  events.push({ summary, time });
  memEvents = events;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events.slice(-30)));
    } catch { /* storage quota */ }
  }
}

export function calendarSkill(t: string): SkillReply | null {
  // 1. Schedule Event / Appointment: "schedule meeting with Alex at 3pm"
  const addMatch = t.match(/^(?:schedule|add event|book|create meeting)\s+(.+?)\s+(?:at|on|for)\s+(.+)/i);
  if (addMatch) {
    const summary = addMatch[1].trim();
    const time = addMatch[2].trim();
    saveCalendarEvent(summary, time);
    return {
      intent: "calendar_add",
      reply: `Scheduled "${summary}" for ${time}. Added to your calendar.`,
    };
  }

  // 2. Schedule & Daily Briefing Lookup
  if (/\b(?:what('?s| is) (?:my |on my )?(?:schedule|calendar)|calendar check|daily briefing|my agenda)\b/i.test(t)) {
    const events = loadCalendarEvents();
    const slots = getSlots();
    const nameStr = slots.userName ? `, ${slots.userName}` : "";
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (events.length === 0) {
      return {
        intent: "calendar_check",
        reply: `Good day${nameStr}! It's ${timeStr}. Your schedule is clear today with no pending meetings.`,
      };
    }

    const eventList = events.slice(0, 3).map((e) => `${e.summary} at ${e.time}`).join(", ");
    return {
      intent: "calendar_check",
      reply: `Here is your schedule${nameStr}: You have ${events.length} event${events.length > 1 ? "s" : ""} today: ${eventList}.`,
    };
  }

  return null;
}
