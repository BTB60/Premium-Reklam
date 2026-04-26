"use client";

import { useEffect, useState } from "react";
import {
  getHomePromoCampaignsRuntime,
  HOME_PROMO_BANNER_KEY,
  HYDRATION_PROMO_CAMPAIGNS,
  loadHomePromoBannerFromRemote,
  type PromoCampaign,
} from "@/lib/homePromoBanner";

export function useHomePromoCampaigns(): PromoCampaign[] {
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>(HYDRATION_PROMO_CAMPAIGNS);

  useEffect(() => {
    const sync = () => setCampaigns(getHomePromoCampaignsRuntime());

    void loadHomePromoBannerFromRemote(false).then(sync);

    window.addEventListener(`storage:${HOME_PROMO_BANNER_KEY}`, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === HOME_PROMO_BANNER_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(`storage:${HOME_PROMO_BANNER_KEY}`, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return campaigns;
}
