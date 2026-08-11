import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Campaign",
  description:
    "Configure how DropifyBot discounts and live campaign behavior work.",
};

export default function CampaignLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
