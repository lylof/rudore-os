import type { Metadata } from "next";
import "./globals.css";
import { Inter, Bricolage_Grotesque } from 'next/font/google';

// Bricolage Grotesque for Headings
const bricolage = Bricolage_Grotesque({
    subsets: ['latin'],
    variable: '--font-bricolage',
    display: 'swap',
});

// Since "Google Sans" isn't directly in next/font/google (it's a proprietary font),
// we will use Inter as a fallback or assume it's provided globally.
// Actually, let's use Inter but styled to mimic Google Sans if not available,
// or use a similar open alternative like "Instrument Sans" or "Geist".
// The USER requested "Google Sans" from DS.json. I will use a local font or CDN if possible.
// For now, I'll use next/font/google with Inter and Bricolage.
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { FeatureFlagProvider } from "@/context/FeatureFlagContext";
import { PointsConfigProvider } from "@/context/PointsConfigContext";
import { KanbanProvider } from "@/context/KanbanContext";

export const metadata: Metadata = {
    title: "Rudore OS",
    description: "Système d'exploitation pour le pilotage de studio et agence",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" suppressHydrationWarning>
            <body className="antialiased" suppressHydrationWarning>
                <ThemeProvider>
                    <AuthProvider>
                        <FeatureFlagProvider>
                            <PointsConfigProvider>
                                <KanbanProvider>
                                    {children}
                                </KanbanProvider>
                            </PointsConfigProvider>
                        </FeatureFlagProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
