import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support | Matchr",
  description:
    "Get help with Matchr — browse answers for creators and brands, check response times, or send our team a message.",
};

export default function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
