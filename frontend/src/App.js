import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';

function App() {
  const [streams, setStreams] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:3001/api/streams', {
        headers: { Authorization: token }
      }).then(res => setStreams(res.data));
    }
  }, [token]);

  const login = async () => {
    const res = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@test.com',
      password: '123456'
    });

    localStorage.setItem('token', res.data.token);
    setToken(res.data.token);
  };

  return (
    <div style={{ background: '#141414', color: 'white', minHeight: '100vh', padding: '20px' }}>
      {!token && (
        <button onClick={login} style={{ padding: 10, fontSize: 18 }}>
          Login
        </button>
      )}

      {selected && (
        <div style={{ marginBottom: 20 }}>
          <h2>{selected.title}</h2>
          <ReactPlayer url={selected.url} controls width="100%" />
          <button onClick={() => setSelected(null)}>Cerrar</button>
        </div>
      )}

      <h2>Catálogo</h2>

      <div style={{ display: 'flex', gap: 15, overflowX: 'auto' }}>
        {streams.map(s => (
          <div
            key={s._id}
            onClick={() => setSelected(s)}
            style={{
              minWidth: 200,
              height: 120,
              background: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              borderRadius: 8
            }}
          >
            {s.title}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
