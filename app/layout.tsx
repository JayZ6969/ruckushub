import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/providers"
import { ConditionalLayout } from "@/components/conditional-layout"
import { SessionTimeoutWarning } from "@/components/session-timeout-warning"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RuckusHub - Internal Q&A Platform",
  description: "Internal Q&A platform for knowledge sharing",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <SessionTimeoutWarning />
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
