import React, { useState } from 'react';
import './Login.css';

export default function Login({ onLogin, postToGas }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await postToGas({ action: 'login', username, password }, 'Login');

      if (data.success) {
        onLogin({ username: data.username, role: data.role });
      } else {
        alert(data.message || 'Login gagal.');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert(`Terjadi kesalahan koneksi.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__shell">
        <div className="login__hero">
          <div className="login__content">
            <div className="login__badge">BK</div>
            <h1>Catatan Anekdot Siswa</h1>
            <p>
              Portal pendataan dan pencatatan perilaku siswa untuk mendukung pelayanan Bimbingan Konseling secara cepat, rapi, dan profesional.
            </p>
            <ul className="login__points">
              <li>Input data siswa lebih cepat</li>
              <li>Monitoring perilaku dan penanganan</li>
              <li>Rekap data yang tertata dengan baik</li>
            </ul>
          </div>
        </div>

        <div className="login__card">
          <div className="login__brand">
            <div className="login__school-badge">BK</div>
            <h2>Login Aplikasi BK</h2>
            <p>MTsN 1 Mojokerto | Sistem Catatan Anekdot</p>
          </div>

          <form className="login__form" onSubmit={handleLogin}>
            <div className="login__field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                className="login__input"
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="login__field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="login__input"
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="login__button" type="submit" disabled={loading}>
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
