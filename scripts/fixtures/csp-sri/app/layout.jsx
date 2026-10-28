import { connection } from 'next/server';
import { headers } from 'next/headers';
import { ThemeProvider } from 'next-themes';

export default async function RootLayout({ children }) {
  let nonce;
  if (process.env.CSP_FIXTURE_MODE === 'nonce') {
    await connection();
    nonce = (await headers()).get('x-nonce') ?? undefined;
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider nonce={nonce} attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
