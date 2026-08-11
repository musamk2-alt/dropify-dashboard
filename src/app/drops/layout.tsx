import type {
  Metadata,
} from "next";

export const metadata:
  Metadata = {
  title: "Drops",
  description:
    "Review viewer and global Dropify discount activity.",
};

export default function DropsLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return children;
}
