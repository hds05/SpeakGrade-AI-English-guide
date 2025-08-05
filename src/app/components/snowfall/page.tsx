'use client';

import { useEffect, useState } from 'react';

interface SnowflakeConfig {
  id: number;
  left: string;
  duration: string;
  size: string;
  delay: string;
}

export default function Snowfall() {
  const [flakes, setFlakes] = useState<SnowflakeConfig[]>([]);

  useEffect(() => {
    const tempFlakes: SnowflakeConfig[] = [];
    for (let i = 0; i < 10; i++) {
      tempFlakes.push({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${3 + Math.random() * 5}s`,
        size: `${Math.random() * 24 + 12}px`,
        delay: `${Math.random()}s`,
      });
    }
    setFlakes(tempFlakes);
  }, []);

  return (
    <div className="h-screen snowfall absolute inset-0 pointer-events-none z-0">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: flake.left,
            animationDuration: flake.duration,
            fontSize: flake.size,
            animationDelay: flake.delay,
          }}
        >
          ❄️
        </div>
      ))}
    </div>
  );
}
