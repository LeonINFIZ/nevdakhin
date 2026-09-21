import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'НЕВДАХИНЪ — Семейная ремесленная мануфактура',
  description:
    'Домашнее ремесленное производство мясных деликатесов, тушенки в автоклаве, заготовок, колбас и заморозки по личным семейным рецептам. Нижегородская обл., д. Бурцево.',
  icons: {
    icon: '/favicon.ico',
    apple: '/images/icon-192.png',
  },
  openGraph: {
    title: 'НЕВДАХИНЪ — Домашние мясные деликатесы и заготовки',
    description: '100% натуральное мясо, ольховый дым, семейные рецепты. ИП Невдахин Д.В.',
    images: ['/images/logo-round.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
