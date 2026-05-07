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

  // Raffle Management State
  const [raffleForm, setRaffleForm] = useState({ id: null, title: '', description: '', price: 10000, totalTickets: 100, drawDate: '', imageUrl: '' });
  const [isSavingRaffle, setIsSavingRaffle] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

    fetch('/api/admin/raffle')
      .then(res => res.json())
      .then(data => {
        if (data.raffle) {
          setRaffleForm({
            id: data.raffle.id,
            title: data.raffle.title || '',
            description: data.raffle.description || '',
            price: data.raffle.price || 10000,
            totalTickets: data.raffle.totalTickets || 100,
            drawDate: data.raffle.drawDate ? new Date(data.raffle.drawDate).toISOString().slice(0, 16) : '',
            imageUrl: data.raffle.images && data.raffle.images.length > 0 ? data.raffle.images[0] : ''
          });
        }
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

  const handleDeletePurchase = async (purchaseId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este cliente? Esto liberará sus números.')) return;
    
    try {
      const res = await fetch('/api/admin/purchases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      });
      const data = await res.json();
      if (data.success) {
        alert('Cliente eliminado y números liberados.');
        loadData(); // Recargar
      } else {
        alert(data.error || 'Error al eliminar');
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

  const handleSaveRaffle = async (e) => {
    e.preventDefault();
    if (!confirm(raffleForm.id ? '¿Guardar cambios en el sorteo actual?' : '¿Crear un NUEVO sorteo? Esto cerrará el sorteo anterior y generará nuevos números.')) return;
    
    setIsSavingRaffle(true);
    try {
      const isNew = !raffleForm.id;
      const res = await fetch('/api/admin/raffle', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(raffleForm)
      });
      const data = await res.json();
      if (data.success) {
        alert(isNew ? 'Sorteo creado exitosamente. Números generados.' : 'Sorteo actualizado.');
        loadData(); // Recargar todo
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    } finally {
      setIsSavingRaffle(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es muy grande. Por favor sube una imagen de menos de 2MB para asegurar un rendimiento óptimo.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        const res = await fetch('/api/admin/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64String })
        });
        
        const data = await res.json();
        if (data.error) {
          alert(data.error);
        } else {
          alert("¡Imagen actualizada correctamente! Ve a la página principal para ver los cambios.");
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
      setIsUploadingImage(false);
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

        {/* GESTIÓN DE SORTEO */}
        <div className={styles.panel} style={{ marginTop: '2rem' }}>

          <h2 style={{ marginBottom: '1.5rem' }}>Gestión de Sorteo</h2>
          <form onSubmit={handleSaveRaffle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Título del Premio</label>
              <input type="text" className={styles.input} value={raffleForm.title} onChange={e => setRaffleForm({...raffleForm, title: e.target.value})} required placeholder="Ej: 10 Perfumes Grandes" />
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Descripción detallada</label>
              <textarea className={styles.input} rows="3" value={raffleForm.description} onChange={e => setRaffleForm({...raffleForm, description: e.target.value})} placeholder="Detalles de los premios..."></textarea>
            </div>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>URL de Imagen del Premio (Opcional)</label>
              <input type="url" className={styles.input} value={raffleForm.imageUrl} onChange={e => setRaffleForm({...raffleForm, imageUrl: e.target.value})} placeholder="https://ejemplo.com/imagen.jpg" />
            </div>
            <div className={styles.formGroup}>
              <label>Precio por Número ($)</label>
              <input type="number" className={styles.input} value={raffleForm.price} onChange={e => setRaffleForm({...raffleForm, price: e.target.value})} required min="1" />
            </div>
            <div className={styles.formGroup}>
              <label>Total de Números</label>
              <input type="number" className={styles.input} value={raffleForm.totalTickets} onChange={e => setRaffleForm({...raffleForm, totalTickets: e.target.value})} required min="10" disabled={!!raffleForm.id} title={raffleForm.id ? "No se puede cambiar la cantidad de números de un sorteo ya creado." : ""} />
            </div>
            <div className={styles.formGroup}>
              <label>Fecha del Sorteo</label>
              <input type="datetime-local" className={styles.input} value={raffleForm.drawDate} onChange={e => setRaffleForm({...raffleForm, drawDate: e.target.value})} required />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className={styles.payButton} disabled={isSavingRaffle} style={{ margin: 0 }}>
                {isSavingRaffle ? 'Guardando...' : (raffleForm.id ? '💾 Guardar Cambios' : '✨ Crear Nuevo Sorteo')}
              </button>
              {raffleForm.id && (
                <button type="button" onClick={() => setRaffleForm({ id: null, title: '', description: '', price: 10000, totalTickets: 100, drawDate: '', imageUrl: '' })} className={styles.payButton} style={{ margin: 0, backgroundColor: '#666' }}>
                  ➕ Limpiar para Crear Nuevo
                </button>
              )}
            </div>
            {!raffleForm.id && (
              <div style={{ gridColumn: '1 / -1', fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                💡 Nota: Al crear un nuevo sorteo, el historial de compras y clientes del sorteo anterior quedará oculto (archivado automáticamente) para que empieces desde cero en esta pantalla.
              </div>
            )}
          </form>
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
                        style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginRight: '0.5rem' }}
                      >
                        Aprobar
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletePurchase(p.id)}
                      style={{ backgroundColor: '#ff4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      title="Eliminar cliente y liberar números"
                    >
                      ❌ Eliminar
                    </button>
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
          <h2>Imagen del Sorteo</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Sube una imagen para mostrar en la página principal. Recomendado: Imagen cuadrada de relación 1:1 (ej. 1024x1024 o 500x500 píxeles). Max 2MB.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              style={{ flex: 1, padding: '0.5rem', border: '1px solid #eaeaea', borderRadius: '8px' }}
              disabled={isUploadingImage}
            />
            {isUploadingImage && <span style={{ color: '#25D366', fontWeight: 'bold' }}>Subiendo...</span>}
          </div>
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
