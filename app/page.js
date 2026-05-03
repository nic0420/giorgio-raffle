"use client";

import { useState, useEffect } from 'react';
import styles from './page.module.css';

export default function Home() {
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [customer, setCustomer] = useState({ name: '', whatsapp: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  // Real State from DB
  const [raffleInfo, setRaffleInfo] = useState({ price: 10000, totalTickets: 100, drawDate: null });
  const [ticketsStatus, setTicketsStatus] = useState({});
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
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
          ticketPrice
        })
      });

      const data = await res.json();
      
      if (data.init_point) {
        window.location.href = data.init_point;
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

  return (
    <div className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero} id="inicio">
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <h2>⭐ SORTEO ACTIVO</h2>
            <h1>GANÁ TU COLECCIÓN DE PERFUMES</h1>
            <p>El ganador podrá elegir 10 perfumes grandes de nuestra colección.</p>
            
            <div className={styles.features}>
              <div className={styles.feature}>
                <span>🛡️</span>
                <div>
                  <strong>100% SEGURO</strong>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Tus datos protegidos</div>
                </div>
              </div>
              <div className={styles.feature}>
                <span>⚡</span>
                <div>
                  <strong>ENVÍO INMEDIATO</strong>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Recibís tu número al instante</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <img src="/premio.png" alt="Colección de Perfumes" className={styles.heroImage} />
          </div>
        </div>
      </section>

      <div className="container">
        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>NÚMEROS VENDIDOS</div>
            <div className={styles.statusValue}>
              {Object.values(ticketsStatus).filter(s => s === 'SOLD').length} / {totalTickets}
            </div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>CIERRE DE VENTAS EN</div>
            <div className={styles.statusValue}>2 DÍAS 14:26:38</div>
          </div>
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>SORTEO</div>
            <div className={styles.statusValue}>SÁB. 01/06/2026</div>
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          
          {/* Left Column: Tickets */}
          <div className={`${styles.panel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2>ELEGÍ TUS NÚMEROS</h2>
                <p style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
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
            
            <div style={{marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--accent-light)', borderRadius: '8px', fontSize: '0.9rem'}}>
              👥 <strong>Podés comprar hasta 5 números por persona.</strong> ¡Sumá más chances, pero dejemos lugar para todos!
            </div>
          </div>

          {/* Right Column: Summary & Checkout */}
          <div className={`${styles.panel} ${styles.summaryPanel}`}>
            <h2 style={{fontFamily: 'Inter', fontSize: '1.25rem', marginBottom: '1.5rem'}}>RESUMEN DE COMPRA</h2>
            
            <div className={styles.summaryRow}>
              <span>Precio por número</span>
              <span>${ticketPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Números seleccionados</span>
              <span>{selectedTickets.length}</span>
            </div>
            
            {selectedTickets.length > 0 && (
              <div style={{marginTop: '1rem', fontSize: '0.85rem'}}>
                <span style={{color: 'var(--text-muted)'}}>Tus números: </span>
                <strong>{selectedTickets.join(', ')}</strong>
              </div>
            )}

            <div className={styles.summaryTotal}>
              <span>TOTAL</span>
              <span>${totalAmount.toLocaleString('es-AR')}</span>
            </div>

            <div style={{marginTop: '2rem'}}>
              <h3 style={{fontSize: '1rem', fontFamily: 'Inter', marginBottom: '1rem'}}>TUS DATOS</h3>
              
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

            <button 
              className={styles.payButton}
              disabled={selectedTickets.length === 0 || !customer.name || !customer.whatsapp || !customer.email || isLoading}
              onClick={handlePayment}
            >
              {isLoading ? 'PROCESANDO...' : '🔒 IR A PAGAR'}
            </button>
            <div style={{textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
              ✓ Pago 100% seguro a través de Mercado Pago
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
