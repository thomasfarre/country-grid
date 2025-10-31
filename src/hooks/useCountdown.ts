"use client";

import { useEffect, useState } from "react";

export const useCountdown = (timeLeft: number | null, active: boolean): number => {
  const [localTime, setLocalTime] = useState(timeLeft ?? 0);

  useEffect(() => {
    setLocalTime(timeLeft ?? 0);
  }, [timeLeft]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const interval = setInterval(() => {
      setLocalTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  return localTime;
};
