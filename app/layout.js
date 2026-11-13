
import "./globals.css";

export const metadata = {
  title: "PIXEL LOVE | A Little Game Made With Love",
  description:
    "Một trò chơi Pixel Art nhỏ dành riêng cho người đặc biệt.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
