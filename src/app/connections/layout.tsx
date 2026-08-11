import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Connections",
  description:
    "Manage DropifyBot Twitch and Shopify integrations.",
};

export default function ConnectionsLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
