"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
const placeholderCalendar = Array.from({ length: 35 }, (_, index) => ({
  key: `placeholder-${index + 1}`,
  day: index + 1,
  muted: index < 3 || index > 30,
  active: false,
}));

type CalendarCell = {
  key: string;
  day: number;
  muted: boolean;
  active: boolean;
};

type LivePanelState = {
  time: string;
  seconds: string;
  timeZone: string;
  label: string;
  calendar: CalendarCell[];
};

const placeholderState: LivePanelState = {
  time: "--:--",
  seconds: "--",
  timeZone: "Asia/Hong_Kong",
  label: "Calendar",
  calendar: placeholderCalendar,
};

function formatTimeParts(value: Date) {
  return {
    time: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Hong_Kong",
    }).format(value),
    seconds: new Intl.DateTimeFormat("zh-CN", {
      second: "2-digit",
      timeZone: "Asia/Hong_Kong",
    }).format(value),
    timeZone: "Asia/Hong_Kong",
    label: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Hong_Kong",
    }).format(value),
  };
}

function buildCalendar(value: Date): CalendarCell[] {
  const hongKongDate = new Date(
    value.toLocaleString("en-US", {
      timeZone: "Asia/Hong_Kong",
    }),
  );
  const year = hongKongDate.getFullYear();
  const month = hongKongDate.getMonth();
  const today = hongKongDate.getDate();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const day = daysInPreviousMonth - firstWeekday + index + 1;
    cells.push({
      key: `prev-${day}`,
      day,
      muted: true,
      active: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      key: `current-${day}`,
      day,
      muted: false,
      active: day === today,
    });
  }

  const remainder = cells.length % 7;

  if (remainder !== 0) {
    for (let day = 1; day <= 7 - remainder; day += 1) {
      cells.push({
        key: `next-${day}`,
        day,
        muted: true,
        active: false,
      });
    }
  }

  return cells;
}

function createLiveState(value: Date): LivePanelState {
  return {
    ...formatTimeParts(value),
    calendar: buildCalendar(value),
  };
}

export function HomeLivePanels({
  currentTimeLabel,
  calendarIconLabel,
}: {
  currentTimeLabel: string;
  calendarIconLabel: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const syncNow = () => {
      setNow(new Date());
    };

    syncNow();

    const timer = window.setInterval(syncNow, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const state = useMemo(() => {
    if (!now) {
      return placeholderState;
    }

    return createLiveState(now);
  }, [now]);

  return (
    <>
      <div className="board-widget-card">
        <div className="board-widget-header">
          <span>{currentTimeLabel}</span>
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
        <div className="board-clock-face">
          <span className="board-clock-time" suppressHydrationWarning>
            {state.time}
            <span className="board-clock-seconds" suppressHydrationWarning>
              :{state.seconds}
            </span>
          </span>
        </div>
        <p className="board-widget-caption" suppressHydrationWarning>
          {state.timeZone}
        </p>
      </div>

      <div className="board-widget-card">
        <div className="board-widget-header">
          <span suppressHydrationWarning>{state.label}</span>
          <CalendarDays className="h-4 w-4 text-primary" aria-label={calendarIconLabel} />
        </div>

        <div className="board-calendar">
          {weekDays.map((item, index) => (
            <span key={`${item}-${index}`} className="board-calendar-weekday">
              {item}
            </span>
          ))}
          {state.calendar.map((item) => (
            <span
              key={item.key}
              className={cn(
                "board-calendar-day",
                item.muted && "board-calendar-day-muted",
                item.active && "board-calendar-day-active",
              )}
              suppressHydrationWarning
            >
              {item.day}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
