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
    if (stats.soldCount === 0) {
      alert("No hay tickets vendidos para realizar el sorteo.");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/draw', { method: 'POST' });
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
        <h1 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>Dashboard del Sorteo</h1>
        
        <div className={styles.contentArea} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>RECAUDACIÓN TOTAL</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
              ${stats.totalRevenue.toLocaleString('es-AR')}
            </div>
          </div>
          
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>NÚMEROS VENDIDOS</h3>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>
              {stats.soldCount} / {stats.totalTickets}
            </div>
          </div>
          
          <div className={styles.panel}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ESTADO DEL SORTEO</h3>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginTop: '1rem', color: stats.status === 'ACTIVE' ? 'var(--success)' : 'var(--primary)' }}>
              {stats.status}
            </div>
          </div>
        </div>

        <div className={styles.panel} style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2>Realizar Sorteo Automático</h2>
            <button 
              className={styles.payButton} 
              style={{ width: 'auto', margin: 0, padding: '0.5rem 1.5rem' }}
              onClick={handleDraw}
              disabled={isLoading || stats.status === 'DRAWN'}
            >
              {isLoading ? 'Sorteando...' : '🎲 Sortear Ganador'}
            </button>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            El sistema elegirá un número ganador al azar, únicamente entre los números que han sido pagados y confirmados.
          </p>

          {winner && (
            <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>🎉 ¡TENEMOS UN GANADOR! 🎉</h3>
              <div style={{ fontSize: '4rem', fontWeight: '700', fontFamily: 'Playfair Display', margin: '1rem 0', color: 'var(--primary)' }}>
                #{winner.number}
              </div>
              <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>{winner.name}</p>
              <p style={{ color: 'var(--text-muted)' }}>{winner.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
