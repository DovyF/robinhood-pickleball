"use client";

import { useEffect, useState } from "react";

export function LocalTime({ date, options }: { date: string; options: Intl.DateTimeFormatOptions }) {
  const utc = { ...options, timeZone: "UTC" };
  const [text, setText] = useState(() => new Intl.DateTimeFormat("en-US", utc).format(new Date(date)));

  useEffect(() => {
    setText(new Intl.DateTimeFormat("en-US", options).format(new Date(date)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return <span>{text}</span>;
}
