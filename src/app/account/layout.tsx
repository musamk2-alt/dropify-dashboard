import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Account",
  description:
    "Review your DropifyBot account and connected identity.",
};

export default function AccountLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
