"use client";

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Real Data State
  const [stats, setStats] = useState({ totalRevenue: 0, soldCount: 0, totalTickets: 100, status: 'ACTIVE' });
  const [purchases, setPurchases] = useState([]);
  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [winningNumber, setWinningNumber] = useState('');

  const loadData = () => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setStats(data);
      })
      .catch(console.error);

    fetch('/api/admin/purchases')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPurchases(data.purchases || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') { // Para demo. En prod, usar backend auth.
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleApprove = async (purchaseId) => {
    if (!confirm('¿Estás seguro de que recibiste el pago y quieres aprobar estos números?')) return;
    
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId, action: 'APPROVE' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Pago aprobado. Números vendidos.');
        loadData(); // Recargar
      } else {
        alert(data.error || 'Error al aprobar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const handleDraw = async () => {
    if (!winningNumber) {
      alert("Por favor ingresá el número ganador de la Lotería.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/draw', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winningNumber })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setWinner(data.winner);
        setStats(prev => ({ ...prev, status: 'DRAWN' }));
      }
    } catch (err) {
      console.error(err);
      alert('Error al realizar el sorteo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWinner = async () => {
    if (!confirm('¿Confirmar a este ganador para que aparezca públicamente en la página?')) return;
    
    try {
      const res = await fetch('/api/draw', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmWinner: true })
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Ganador confirmado públicamente!');
        setStats(prev => ({ ...prev, status: 'COMPLETED' }));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.main} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.panel} style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Panel de Administración</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>Contraseña</label>
              <input 
                type="password" 
                className={styles.input} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className={styles.payButton}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main} style={{ padding: '4rem 0' }}>
      <div className="container">
        <h1 style={{ marginBottom: '2rem', color: '#000' }}>Dashboard del Sorteo</h1>
        
        <div className={`${styles.contentArea} ${styles.adminStatsGrid}`} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: '#666' }}>RECAUDACIÓN TOTAL</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
              ${stats.totalRevenue.toLocaleString('es-AR')}
            </div>
          </div>
          
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: '#666' }}>NÚMEROS VENDIDOS</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
              {stats.soldCount} / {stats.totalTickets}
            </div>
          </div>
          
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: '#666' }}>ESTADO DEL SORTEO</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '1rem', color: stats.status === 'ACTIVE' ? '#25D366' : '#000' }}>
              {stats.status}
            </div>
          </div>
        </div>

        {/* COMPRAS PENDIENTES / APROBADAS */}
        <div className={styles.panel} style={{ marginTop: '2rem', overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Lista de Compras</h2>
          <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eaeaea', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem' }}>Cliente</th>
                <th style={{ padding: '0.75rem' }}>WhatsApp</th>
                <th style={{ padding: '0.75rem' }}>Monto</th>
                <th style={{ padding: '0.75rem' }}>Números</th>
                <th style={{ padding: '0.75rem' }}>Estado</th>
                <th style={{ padding: '0.75rem' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                  <td style={{ padding: '0.75rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '0.75rem' }}>{p.customerName}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <a href={`https://wa.me/${p.customerPhone.replace(/\D/g, '')}`} target="_blank" style={{ color: '#25D366', fontWeight: 'bold' }}>{p.customerPhone}</a>
                  </td>
                  <td style={{ padding: '0.75rem' }}>${p.totalAmount}</td>
                  <td style={{ padding: '0.75rem' }}>{p.tickets?.map(t => t.number).join(', ')}</td>
                  <td style={{ padding: '0.75rem', color: p.status === 'APPROVED' ? '#25D366' : '#ffa500', fontWeight: 'bold' }}>{p.status}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {p.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApprove(p.id)}
                        style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Aprobar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '1rem' }}>No hay ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.panel} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Buscar Ganador</h2>
          </div>
          
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Ingresá los últimos dígitos ganadores de la <strong>Lotería Nacional Nocturna</strong> para buscar al ganador.
          </p>

          <div className={styles.adminDrawBox} style={{ display: 'flex', gap: '1rem', maxWidth: '400px' }}>
            <input 
              type="number" 
              className={styles.input} 
              placeholder="Ej: 45"
              value={winningNumber}
              onChange={(e) => setWinningNumber(e.target.value)}
              disabled={stats.status === 'COMPLETED'}
            />
            <button 
              className={styles.payButton} 
              style={{ margin: 0, padding: '0.5rem 1.5rem', whiteSpace: 'nowrap' }}
              onClick={handleDraw}
              disabled={isLoading || stats.status === 'COMPLETED' || !winningNumber}
            >
              {isLoading ? 'Buscando...' : '🔎 Buscar Número'}
            </button>
          </div>

          {winner && (
            <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#fdfaf5', border: '1px solid #f0e6d2', borderRadius: '12px' }}>
              <h3 style={{ color: '#000', marginBottom: '1rem', textAlign: 'center' }}>🎉 ¡GANADOR ENCONTRADO! 🎉</h3>
              <div style={{ fontSize: '4rem', fontWeight: '700', fontFamily: 'Playfair Display', margin: '1rem 0', color: '#000', textAlign: 'center' }}>
                #{winner.number}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem', backgroundColor: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eaeaea' }}>
                <div><strong>Nombre y Apellido:</strong> {winner.name}</div>
                <div><strong>WhatsApp:</strong> <a href={`https://wa.me/${winner.phone.replace(/\D/g, '')}`} target="_blank" style={{color: '#25D366'}}>{winner.phone}</a></div>
                <div><strong>Email:</strong> {winner.email}</div>
                <div><strong>Número Ganador:</strong> #{winner.number}</div>
                <div><strong>Fecha de Compra:</strong> {new Date(winner.purchaseDate).toLocaleString()}</div>
                <div><strong>Estado de Pago:</strong> <span style={{color: winner.purchaseStatus === 'APPROVED' ? '#25D366' : 'red'}}>{winner.purchaseStatus}</span></div>
                <div><strong>Total de números comprados:</strong> {winner.totalNumbers}</div>
                <div><strong>ID de Operación / Pedido:</strong> #{winner.orderId}</div>
              </div>

              {stats.status !== 'COMPLETED' && (
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                  <button 
                    onClick={handleConfirmWinner}
                    style={{ backgroundColor: '#000', color: '#fff', border: 'none', padding: '1rem 2rem', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                  >
                    🏆 Confirmar Ganador Público
                  </button>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>Al confirmar, el cartel del ganador será visible para todos en la página web.</p>
                </div>
              )}
              {stats.status === 'COMPLETED' && (
                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#25D366', fontWeight: 'bold' }}>
                  ¡Sorteo finalizado! El ganador ya es público.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
