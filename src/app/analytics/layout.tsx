import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Analytics",
  description:
    "Measure DropifyBot discount performance and attributed Shopify revenue.",
};

export default function AnalyticsLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
