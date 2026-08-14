import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

function App() {
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('peliculas');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const [moviesRes, seriesRes, channelsRes] = await Promise.all([
        axios.get(`${API_URL}/movies`),
        axios.get(`${API_URL}/series`),
        axios.get(`${API_URL}/channels`)
      ]);
      
      setMovies(moviesRes.data || []);
      setSeries(seriesRes.data || []);
      setChannels(channelsRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('No se pudo cargar el contenido. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.loading}>
          <div className="spinner"></div>
          <p>Cargando contenido...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.error}>
          <p>⚠️ {error}</p>
          <button onClick={fetchContent} style={styles.retryButton}>
            Reintentar
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'peliculas':
        return renderGrid(movies, 'película');
      case 'series':
        return renderGrid(series, 'serie');
      case 'tv':
        return renderChannels(channels);
      default:
        return null;
    }
  };

  const renderGrid = (items, type) => {
    if (!items || items.length === 0) {
      return (
        <div style={styles.empty}>
          <p>No hay {type}s disponibles</p>
        </div>
      );
    }

    return (
      <div style={styles.grid}>
        {items.map((item) => (
          <div key={item._id || item.id} style={styles.card}>
            <img 
              src={item.poster || item.image || '/placeholder.png'} 
              alt={item.title || item.name}
              style={styles.cardImage}
              onError={(e) => e.target.src = '/placeholder.png'}
            />
            <div style={styles.cardInfo}>
              <h3 style={styles.cardTitle}>{item.title || item.name}</h3>
              {item.year && <span style={styles.cardYear}>{item.year}</span>}
              {item.rating && (
                <span style={styles.cardRating}>⭐ {item.rating}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderChannels = (channelsList) => {
    if (!channelsList || channelsList.length === 0) {
      return (
        <div style={styles.empty}>
          <p>No hay canales disponibles</p>
        </div>
      );
    }

    return (
      <div style={styles.grid}>
        {channelsList.map((channel) => (
          <div key={channel.id || channel._id} style={styles.channelCard}>
            <img 
              src={channel.logo || '/placeholder.png'} 
              alt={channel.name}
              style={styles.channelLogo}
              onError={(e) => e.target.src = '/placeholder.png'}
            />
            <h3 style={styles.channelName}>{channel.name}</h3>
            {channel.category && (
              <span style={styles.channelCategory}>{channel.category}</span>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>StreamX</h1>
        <nav style={styles.nav}>
          <button 
            className={activeTab === 'peliculas' ? 'active' : ''}
            onClick={() => setActiveTab('peliculas')}
            style={styles.navButton}
          >
            Películas
          </button>
          <button 
            className={activeTab === 'series' ? 'active' : ''}
            onClick={() => setActiveTab('series')}
            style={styles.navButton}
          >
            Series
          </button>
          <button 
            className={activeTab === 'tv' ? 'active' : ''}
            onClick={() => setActiveTab('tv')}
            style={styles.navButton}
          >
            TV en Vivo
          </button>
        </nav>
      </header>

      <main style={styles.main}>
        {renderContent()}
      </main>

      <footer style={styles.footer}>
        <p>&copy; 2024 StreamX - Plataforma de Streaming</p>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: '#09090b',
    color: '#f4f4f5',
    fontFamily: "'Segoe UI', system-ui, sans-serif"
  },
  header: {
    background: '#18181b',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5px solid #a78bfa'
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#8b5cf6'
  },
  nav: {
    display: 'flex',
    gap: '10px'
  },
  navButton: {
    padding: '8px 16px',
    background: 'rgba(139, 92, 246, 0.12)',
    border: '1px solid rgba(139, 92, 246, 0.25)',
    borderRadius: '20px',
    color: '#f4f4f5',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600'
  },
  main: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    padding: '20px 0'
  },
  card: {
    background: '#18181b',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  },
  cardImage: {
    width: '100%',
    height: '300px',
    objectFit: 'cover'
  },
  cardInfo: {
    padding: '12px'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  cardYear: {
    fontSize: '12px',
    color: '#71717a',
    marginRight: '10px'
  },
  cardRating: {
    fontSize: '12px',
    color: '#f59e0b'
  },
  channelCard: {
    background: '#18181b',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(139, 92, 246, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  channelLogo: {
    width: '80px',
    height: '80px',
    objectFit: 'contain',
    marginBottom: '12px'
  },
  channelName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px'
  },
  channelCategory: {
    fontSize: '11px',
    color: '#71717a'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  error: {
    background: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid #e74c3c',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center'
  },
  retryButton: {
    marginTop: '10px',
    padding: '8px 20px',
    background: '#e74c3c',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '700'
  },
  empty: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#71717a'
  },
  footer: {
    background: '#18181b',
    padding: '20px',
    textAlign: 'center',
    borderTop: '1px solid rgba(139, 92, 246, 0.12)',
    marginTop: '40px',
    fontSize: '13px',
    color: '#71717a'
  }
};

export default App;
