import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Matchr",
  description:
    "How Matchr collects, uses, shares, and protects the data of creators and brands — including your rights, retention periods, and processors.",
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
