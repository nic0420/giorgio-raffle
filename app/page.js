"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [customer, setCustomer] = useState({ name: '', whatsapp: '', email: '' });
  const [paymentMethod, setPaymentMethod] = useState('TRANSFERENCIA');
  const [isLoading, setIsLoading] = useState(false);
  
  // Real State from DB
  const [raffleInfo, setRaffleInfo] = useState({ price: 10000, totalTickets: 100, drawDate: '2026-06-01T00:00:00.000Z' });
  const [ticketsStatus, setTicketsStatus] = useState({});
  const [isFetching, setIsFetching] = useState(true);

  // Status params
  const [urlStatus, setUrlStatus] = useState(null);

  useEffect(() => {
    // Check URL parameters for payment status
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      if (status) {
        setUrlStatus(status);
      }
    }

    async function loadData() {
      try {
        const res = await fetch('/api/raffle');
        const data = await res.json();
        if (data.raffle) {
          setRaffleInfo(data.raffle);
          setTicketsStatus(data.tickets);
        }
      } catch (err) {
        console.error('Failed to load raffle:', err);
      } finally {
        setIsFetching(false);
      }
    }
    loadData();
  }, []);

  const ticketPrice = raffleInfo.price;
  const totalTickets = raffleInfo.totalTickets;
  const soldCount = Object.values(ticketsStatus).filter(s => s === 'SOLD').length;

  const handleTicketClick = (num) => {
    const status = ticketsStatus[num];
    if (status === 'SOLD' || status === 'RESERVED') return;
    
    if (selectedTickets.includes(num)) {
      setSelectedTickets(selectedTickets.filter(t => t !== num));
    } else {
      if (selectedTickets.length >= 5) {
        alert("Podés comprar hasta 5 números por persona.");
        return;
      }
      setSelectedTickets([...selectedTickets, num].sort((a,b) => a - b));
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTickets,
          customer,
          ticketPrice,
          paymentMethod
        })
      });

      const data = await res.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert("Hubo un error al procesar el pago. Por favor intenta de nuevo.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = selectedTickets.length * ticketPrice;

  // Render modal for success or manual payment
  const renderStatusModal = () => {
    if (!urlStatus) return null;
    
    if (urlStatus === 'success') {
      return (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>¡Pago Exitoso! 🎉</h2>
            <p>Tus números han sido confirmados. Te enviamos un email con los detalles.</p>
            <button className={styles.waButton} onClick={() => window.open(`https://wa.me/5491100000000?text=Hola! Acabo de comprar números en la rifa. Mi email es ${customer.email || ''}`, '_blank')}>
              Confirmar por WhatsApp
            </button>
            <button className={styles.closeBtn} onClick={() => window.location.href = '/'}>Volver al inicio</button>
          </div>
        </div>
      );
    }
    if (urlStatus === 'pending_manual') {
      const urlParams = new URLSearchParams(window.location.search);
      const method = urlParams.get('method');
      return (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>¡Números Reservados! ⏳</h2>
            <p>Elegiste pagar mediante <strong>{method}</strong>.</p>
            <p>Tus números están reservados por 1 hora. Por favor, envianos el comprobante por WhatsApp para confirmarlos definitivamente.</p>
            <button className={styles.waButton} onClick={() => window.open(`https://wa.me/5491100000000?text=Hola! Reservé números pagando con ${method}. Acá te mando el comprobante.`, '_blank')}>
              Enviar comprobante por WhatsApp
            </button>
            <button className={styles.closeBtn} onClick={() => window.location.href = '/'}>Cerrar</button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.main}>
      {renderStatusModal()}

      {/* Header */}
      <header className={styles.header}>
        <div className={`container ${styles.headerContainer}`}>
          <div className={styles.logo}>
            Giorgio <span>(store)</span>
          </div>
          <nav className={styles.nav}>
            <a href="#inicio">INICIO</a>
            <a href="#como-funciona">CÓMO FUNCIONA</a>
            <a href="#ganadores">GANADORES</a>
            <a href="#contacto">CONTACTO</a>
          </nav>
          <div className={styles.cartBtn}>
            🛒 MI COMPRA <span className={styles.cartBadge}>{selectedTickets.length}</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero} id="inicio">
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <div className={styles.badge}>⭐ SORTEO ACTIVO</div>
            <h1>GANÁ TU<br/>COLECCIÓN<br/>DE PERFUMES</h1>
            <h3 className={styles.subtitle}>10 PERFUMES GRANDES A ELECCIÓN</h3>
            <p>El ganador podrá elegir 10 perfumes<br/>grandes de nuestra colección.</p>
            
            <div className={styles.features}>
              <div className={styles.feature}>
                <span className={styles.icon}>🛡️</span>
                <div>
                  <strong>100% SEGURO</strong>
                  <div className={styles.featureDesc}>Tus datos protegidos</div>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.icon}>⚡</span>
                <div>
                  <strong>ENVÍO INMEDIATO</strong>
                  <div className={styles.featureDesc}>Recibís tu número al instante</div>
                </div>
              </div>
              <div className={styles.feature}>
                <span className={styles.icon}>🏆</span>
                <div>
                  <strong>SORTEO POR LOTERÍA NOCTURNA</strong>
                  <div className={styles.featureDesc}>Fecha del sorteo abajo</div>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <img src="https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=800" alt="Colección de Perfumes" className={styles.heroImage} />
            <div className={styles.floatingBadge}>
              <strong>👥 HASTA 5 NÚMEROS<br/>POR PERSONA</strong>
              <span>Para que más personas<br/>tengan la oportunidad<br/>de ganar.</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>NÚMEROS VENDIDOS</div>
            <div className={styles.statusValueWithBar}>
              <div className={styles.statusValue}>{soldCount} / {totalTickets}</div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{width: `${(soldCount/totalTickets)*100}%`}}></div>
              </div>
            </div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>CIERRE DE VENTAS EN</div>
            <div className={styles.statusValue}>
              <div className={styles.countdown}>
                <div><strong>2</strong><span>DÍAS</span></div> :
                <div><strong>14</strong><span>HORAS</span></div> :
                <div><strong>26</strong><span>MIN</span></div> :
                <div><strong>38</strong><span>SEG</span></div>
              </div>
            </div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>SORTEO</div>
            <div className={styles.statusDate}>SÁBADO 01/06/2026</div>
            <div className={styles.statusSubDate}>Por Lotería Nacional Nocturna</div>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          
          {/* Left Column: Tickets */}
          <div className={`${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2>ELEGÍ TUS NÚMEROS</h2>
                <p className={styles.panelDesc}>
                  Seleccioná tus números favoritos del 1 al {totalTickets}
                </p>
              </div>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.available}`}></div>
                  Disponible
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.selected}`}></div>
                  Seleccionado
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.dot} ${styles.sold}`}></div>
                  Vendido
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {Array.from({ length: totalTickets }, (_, i) => i + 1).map((num) => {
                const status = ticketsStatus[num];
                const isSoldOrReserved = status === 'SOLD' || status === 'RESERVED';
                const isSelected = selectedTickets.includes(num);
                return (
                  <button
                    key={num}
                    className={`${styles.ticket} ${isSelected ? styles.selected : ''}`}
                    disabled={isSoldOrReserved || isFetching}
                    onClick={() => handleTicketClick(num)}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            
            <div className={styles.infoBox}>
              👥 <strong>Podés comprar hasta 5 números por persona.</strong> ¡Sumá más chances, pero dejemos lugar para todos!
            </div>

            {selectedTickets.length > 0 && (
              <div className={styles.bottomSummary}>
                <div>
                  <div className={styles.bottomSummaryLabel}>TUS NÚMEROS SELECCIONADOS ({selectedTickets.length})</div>
                  <div className={styles.bottomSummaryBubbles}>
                    {selectedTickets.map(num => <span key={num} className={styles.bubble}>{num}</span>)}
                  </div>
                </div>
                <div className={styles.bottomSummaryTotal}>
                  <div className={styles.bottomSummaryLabel}>TOTAL A PAGAR</div>
                  <div className={styles.bottomSummaryAmount}>${totalAmount.toLocaleString('es-AR')}</div>
                  <div className={styles.bottomSummaryUnit}>(${ticketPrice.toLocaleString('es-AR')} c/u)</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Summary & Checkout */}
          <div className={`${styles.panel} ${styles.summaryPanel}`}>
            <h2 className={styles.summaryTitle}>RESUMEN DE COMPRA</h2>
            
            <div className={styles.summaryRow}>
              <span>Precio por número</span>
              <span>${ticketPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Números seleccionados</span>
              <span>{selectedTickets.length}</span>
            </div>
            
            <div className={styles.summaryTotal}>
              <span>TOTAL</span>
              <span>${totalAmount.toLocaleString('es-AR')}</span>
            </div>

            <div style={{marginTop: '2rem'}}>
              <h3 className={styles.sectionTitle}>TUS DATOS</h3>
              
              <div className={styles.formGroup}>
                <label>Nombre completo</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="Ej: Juan Pérez"
                  value={customer.name}
                  onChange={(e) => setCustomer({...customer, name: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>WhatsApp</label>
                <input 
                  type="tel" 
                  className={styles.input} 
                  placeholder="Ej: 11 2345 6789"
                  value={customer.whatsapp}
                  onChange={(e) => setCustomer({...customer, whatsapp: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  placeholder="Ej: juan@email.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                />
              </div>
            </div>

            <div style={{marginTop: '2rem'}}>
              <h3 className={styles.sectionTitle}>MÉTODOS DE PAGO</h3>
              
              <div className={styles.paymentMethods}>
                <label className={`${styles.paymentMethod} ${paymentMethod === 'TRANSFERENCIA' ? styles.activeMethod : ''}`}>
                  <input type="radio" name="payment" value="TRANSFERENCIA" checked={paymentMethod === 'TRANSFERENCIA'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className={styles.paymentMethodInfo}>
                    <strong>Transferencia bancaria</strong>
                    <span>Te enviamos los datos para transferir.</span>
                  </div>
                  <img src="/bank-icon.png" alt="Bank" className={styles.paymentIcon} />
                </label>
                
                <label className={`${styles.paymentMethod} ${paymentMethod === 'MERCADOPAGO' ? styles.activeMethod : ''}`}>
                  <input type="radio" name="payment" value="MERCADOPAGO" checked={paymentMethod === 'MERCADOPAGO'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className={styles.paymentMethodInfo}>
                    <strong>Mercado Pago</strong>
                    <span>Pagá con tarjeta, saldo en cuenta o efectivo.</span>
                  </div>
                  <img src="/mp-icon.png" alt="MercadoPago" className={styles.paymentIcon} />
                </label>

                <label className={`${styles.paymentMethod} ${paymentMethod === 'EFECTIVO' ? styles.activeMethod : ''}`}>
                  <input type="radio" name="payment" value="EFECTIVO" checked={paymentMethod === 'EFECTIVO'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <div className={styles.paymentMethodInfo}>
                    <strong>Efectivo (Rapipago / Pago Fácil)</strong>
                    <span>Te enviamos un código para pagar.</span>
                  </div>
                  <img src="/cash-icon.png" alt="Cash" className={styles.paymentIcon} />
                </label>
              </div>
            </div>

            <button 
              className={styles.payButton}
              disabled={selectedTickets.length === 0 || !customer.name || !customer.whatsapp || !customer.email || isLoading}
              onClick={handlePayment}
            >
              {isLoading ? 'PROCESANDO...' : '🔒 IR A PAGAR'}
            </button>
            <div className={styles.securePayment}>
              ✓ Pago 100% seguro
            </div>
          </div>
        </div>

        {/* Info Cards Footer */}
        <div className={styles.infoCards} id="como-funciona">
          <div className={styles.infoCard}>
            <h4 className={styles.infoCardTitle}>CONFIANZA QUE NOS RESPALDA</h4>
            <div className={styles.infoCardStats}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>👤</div>
                <div className={styles.statNumber}>+2.500</div>
                <div className={styles.statLabel}>Clientes<br/>satisfechos</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>🎁</div>
                <div className={styles.statNumber}>+50</div>
                <div className={styles.statLabel}>Sorteos<br/>realizados</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statIcon}>🛡️</div>
                <div className={styles.statNumber}>100%</div>
                <div className={styles.statLabel}>Transparencia<br/>en cada sorteo</div>
              </div>
            </div>
          </div>
          
          <div className={styles.infoCard}>
            <h4 className={styles.infoCardTitle}>¿CÓMO FUNCIONA?</h4>
            <ol className={styles.stepsList}>
              <li>Elegís tus números del 1 al {totalTickets}.</li>
              <li>Completás tus datos y realizás el pago.</li>
              <li>Recibís tu número al instante por WhatsApp.</li>
              <li>El sorteo se realizará por <strong>Lotería Nacional Nocturna</strong> el día <strong>01/06/2026</strong>.</li>
            </ol>
          </div>

          <div className={styles.infoCard} id="ganadores">
            <h4 className={styles.infoCardTitle}>GANADORES REALES</h4>
            <p className={styles.winnersDesc}>Ellos ya ganaron en sorteos anteriores</p>
            <div className={styles.winnersImages}>
              <div className={styles.winnerAvatar}></div>
              <div className={styles.winnerAvatar}></div>
              <div className={styles.winnerAvatar}></div>
              <div className={styles.winnerAvatar}></div>
            </div>
            <button className={styles.winnersBtn}>VER MÁS GANADORES</button>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom Bar */}
      <div className={styles.bottomFooterBanner}>
        <div className="container" style={{display: 'flex', justifyContent: 'space-between'}}>
          <div className={styles.footerCol}>
            <strong>¿POR QUÉ PARTICIPAR?</strong>
          </div>
          <div className={styles.footerCol}>
            <span style={{fontSize: '1.2rem', marginRight: '0.5rem'}}>🎁</span>
            <div>
              <strong>PREMIO INCREÍBLE</strong>
              <div>10 perfumes grandes a elección del ganador.</div>
            </div>
          </div>
          <div className={styles.footerCol}>
            <span style={{fontSize: '1.2rem', marginRight: '0.5rem'}}>⭐</span>
            <div>
              <strong>POCAS POSIBILIDADES</strong>
              <div>Solo {totalTickets} números disponibles.</div>
            </div>
          </div>
          <div className={styles.footerCol}>
            <span style={{fontSize: '1.2rem', marginRight: '0.5rem'}}>🛡️</span>
            <div>
              <strong>SORTEO TRANSPARENTE</strong>
              <div>Por Lotería Nacional Nocturna.</div>
            </div>
          </div>
          <div className={styles.footerCol}>
            <span style={{fontSize: '1.2rem', marginRight: '0.5rem'}}>🚚</span>
            <div>
              <strong>ENVÍO A TODO EL PAÍS</strong>
              <div>Recibí tu premio donde estés.</div>
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className="container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div className={styles.footerLogo}>Giorgio <span>(store)</span></div>
          <div className={styles.footerCopy}>© 2024 Giorgio (store) - Todos los derechos reservados.</div>
          <div className={styles.footerSocials}>
            <span>SEGUINOS EN</span>
            <span className={styles.socialIcon}>📷</span>
            <span className={styles.socialIcon}>💬</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
