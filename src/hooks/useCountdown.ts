import { useState, useEffect, useRef } from 'react';

interface CountdownResult {
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(targetMinutes: number): CountdownResult {
  const [totalSeconds, setTotalSeconds] = useState(targetMinutes * 60);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setTotalSeconds(targetMinutes * 60);

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(targetMinutes * 60 - elapsed, 0);
      setTotalSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetMinutes]);

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    isExpired: totalSeconds <= 0,
  };
}
