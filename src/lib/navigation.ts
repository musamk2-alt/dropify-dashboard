import {
  BarChart3,
  Cable,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  PackageOpen,
  UserRound,
} from "lucide-react";

export const dashboardNavigation = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: "Drops",
    href: "/drops",
    icon: PackageOpen,
    available: true,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    available: true,
  },
  {
    label: "Campaign",
    href: "/campaign",
    icon: Megaphone,
    available: true,
  },
  {
    label: "Connections",
    href: "/connections",
    icon: Cable,
    available: true,
  },
];

export const accountNavigation = [
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
    available: true,
  },
  {
    label: "Account",
    href: "/account",
    icon: UserRound,
    available: true,
  },
];

export type DashboardNavigationItem =
  | (typeof dashboardNavigation)[number]
  | (typeof accountNavigation)[number];
