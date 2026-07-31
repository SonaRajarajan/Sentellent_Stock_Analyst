import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sentellent Equity Chief | Contextual Agentic AI Indian Stock Analyst',
  description: 'AI-powered Equity Research Chief of Staff for NSE / BSE stocks using RAG, dynamic investor persona memory, and Screener.in fundamentals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
