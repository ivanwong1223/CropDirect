"use client";

import { useEffect, useMemo, useState } from "react";
import LogisticsProfileDialog from "@/components/custom/LogisticsProfileDialog";
import { getUserData } from "@/lib/localStorage";

export default function LogisticsDashboard() {
  const welcomeMessages = [
    "Welcome to your logistics command center! 🚚",
    "Ready to manage your deliveries? Let's get started! 📦",
    "Your logistics dashboard awaits - time to move some cargo! 🌟",
    "Welcome aboard the logistics express! 🚛",
    "Command your fleet from here - welcome back! 🗺️",
  ];

  const randomMessage = useMemo(() => welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)], []);

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const user = getUserData();
        if (!user?.id) return;
        const resp = await fetch(`/api/user/logistics?userId=${user.id}`);
        if (!resp.ok) return; // silently ignore if not found
        const data = await resp.json();
        if (!data?.success || !data?.data) return;
        const p = data.data as {
          companyAddress?: string | null;
          businessImage?: string | null;
          contactNo?: string | null;
          serviceAreas?: string[] | null;
          transportModes?: string[] | null;
        };
        const missing = !p.companyAddress || !p.businessImage || !p.contactNo || !p.serviceAreas?.length || !p.transportModes?.length;
        if (missing) setProfileDialogOpen(true);
      } catch (e) {
        console.error("Failed to check logistics profile:", e);
      }
    };
    checkProfile();
  }, []);

  return (
    <div className="p-4">
      <LogisticsProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      {randomMessage}
    </div>
  );
}
