import "./globals.css";

export const metadata = {
  title: "ExamSecure",
  description: "Secure management of competitive examination question papers"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}