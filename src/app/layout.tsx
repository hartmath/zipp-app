import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: 'Zipplign',
  description: 'Ride your Zip',
  icons: {
    icon: '/Images/icon.jpg?v=3',
    apple: '/Images/icon.jpg?v=3',
    shortcut: '/Images/icon.jpg?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/Images/icon.jpg?v=3" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/Images/icon.jpg?v=3" />
        <link rel="shortcut icon" href="/Images/icon.jpg?v=3" type="image/jpeg" />
      </head>
      <body className="font-body antialiased h-full">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
