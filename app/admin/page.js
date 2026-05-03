"use client";

import { useState, useEffect } from 'react';
import styles from '../page.module.css';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Real Data State
  const [stats, setStats] = useState({ totalRevenue: 0, soldCount: 0, totalTickets: 100, status: 'ACTIVE' });
  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [winningNumber, setWinningNumber] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
          if (!data.error) setStats(data);
        })
        .catch(console.error);
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
        
        <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
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

        <div className={styles.panel} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Declarar Ganador</h2>
          </div>
          
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Ingresá los últimos dígitos ganadores de la <strong>Lotería Nacional Nocturna</strong> para buscar al ganador.
          </p>

          <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px' }}>
            <input 
              type="number" 
              className={styles.input} 
              placeholder="Ej: 45"
              value={winningNumber}
              onChange={(e) => setWinningNumber(e.target.value)}
              disabled={stats.status === 'DRAWN'}
            />
            <button 
              className={styles.payButton} 
              style={{ margin: 0, padding: '0.5rem 1.5rem', whiteSpace: 'nowrap' }}
              onClick={handleDraw}
              disabled={isLoading || stats.status === 'DRAWN' || !winningNumber}
            >
              {isLoading ? 'Buscando...' : '🏆 Confirmar Ganador'}
            </button>
          </div>

          {winner && (
            <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#fdfaf5', border: '1px solid #f0e6d2', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ color: '#000', marginBottom: '1rem' }}>🎉 ¡TENEMOS UN GANADOR! 🎉</h3>
              <div style={{ fontSize: '4rem', fontWeight: '700', fontFamily: 'Playfair Display', margin: '1rem 0', color: '#000' }}>
                #{winner.number}
              </div>
              <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>{winner.name}</p>
              <p style={{ color: '#666' }}>{winner.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
