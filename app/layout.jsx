
import "./globals.css"

export const metadata = {
  title: "Nutrifai Coach",
  description: "Area riservata clienti & trainer"
}

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="min-h-screen page-gradient">
        {children}
      </body>
    </html>
  )
}
