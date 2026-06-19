import './globals.css';

export const metadata = {
  title: 'NBG Indumentaria - Sorteos Exclusivos',
  description: 'Participá por increíbles premios con nuestros sorteos automáticos y transparentes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="header">
          <div className="container header-content">
            <div className="logo">NBG <span>Indumentaria</span></div>
            <nav className="nav">
              <a href="#inicio">INICIO</a>
              <a href="#como-funciona">CÓMO FUNCIONA</a>
              <a href="#ganadores">GANADORES</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="container">
            <p>© 2026 NBG Indumentaria - Todos los derechos reservados.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
