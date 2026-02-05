export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children directly without any wrapper
  // The page itself handles the full HTML document
  return children;
}
