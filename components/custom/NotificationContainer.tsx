"use client";

import React from "react";
import { AnimatedList } from "@/components/magicui/animated-list";

interface NotificationContainerProps {
  notifications: React.ReactNode[];
}

export default function NotificationContainer({ notifications }: NotificationContainerProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] w-80">
      <AnimatedList delay={1200} className="items-end">
        {notifications.map((n, i) => (
          <div key={i} className="pointer-events-auto">{n}</div>
        ))}
      </AnimatedList>
    </div>
  );
}