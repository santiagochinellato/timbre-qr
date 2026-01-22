import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/smooth-scroll";
import { Toaster } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";
import { PushManager } from "@/components/push-manager";
import { RealtimeProvider } from "@/components/providers/realtime-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Llegue!",
  description: "Visitor Entry System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} no-scrollbar`}
      suppressHydrationWarning
    >
      <body
        className="antialiased bg-bg-app text-text-main tracking-tight font-medium min-h-dvh flex flex-col pt-safe pb-safe overflow-x-hidden font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScroll>
            <RealtimeProvider>
              <PushManager />
              {children}
              <Toaster />
            </RealtimeProvider>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
