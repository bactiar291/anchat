import "./globals.css";

export const metadata = {
  applicationName: "ANAM BACTIAR Chatbot",
  title: "ANAM BACTIAR — AI Chatbot",
  description: "Chatbot AI Powered by Groq — Anam Bactiar",
  referrer: "strict-origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
