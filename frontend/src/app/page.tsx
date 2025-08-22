"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/admin"); 
  }, [router]);

  // Redirect to the dashboard page
  useEffect
  return null;
}
