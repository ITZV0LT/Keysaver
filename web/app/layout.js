import './globals.css';

export const metadata = {
  title: 'KeySaver — AI Key Identification',
  description: 'Photograph your keys. AI identifies the type, keyway, and bitting. Save and manage all your keys in one app.',
  keywords: 'key identifier, key bitting, keyway, locksmith app, key management, AI key scanner',
  openGraph: {
    title: 'KeySaver — AI Key Identification',
    description: 'Photograph your keys. AI identifies the type, keyway, and bitting.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
