import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy AI CSV Importer',
  description: 'Minimal AI CSV importer for the internship assignment',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
