import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Billing",
  description:
    "Manage your DropifyBot plan, usage and Stripe subscription.",
};

export default function BillingLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
