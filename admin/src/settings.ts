export type Strategy = "lowest_price" | "highest_commission" | "best_potential";

export type Settings = {
  group_name: string;
  interval_minutes: number;
  strategy: Strategy;
  authorized_numbers: string[];
  last_dispatch_at: string | null;
};

export const emptySettings: Settings = {
  group_name: "pack_shopee_ia",
  interval_minutes: 180,
  strategy: "best_potential",
  authorized_numbers: [],
  last_dispatch_at: null,
};
