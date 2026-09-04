"use client";

export function LocalTime({ date, options }: { date: string; options: Intl.DateTimeFormatOptions }) {
  return <span suppressHydrationWarning>{new Intl.DateTimeFormat("en-US", options).format(new Date(date))}</span>;
}
