"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureLeadAttribution } from "@/lib/lead-attribution";

export function LeadAttribution() {
  const path = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    captureLeadAttribution(path, search.toString());
  }, [path, search]);

  return null;
}
