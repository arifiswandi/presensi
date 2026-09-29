import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './PresensiDashboard.css';

const CLASS_OPTIONS = ['X-IPA-1', 'X-IPA-2', 'X-IPS-1'];
const TOTAL_ACTIVE_STUDENTS = 10;
const TOTAL_CLASSES = 3;
const ATTENDANCE_RATE = 72.7;
const TOTAL_SESSIONS = 6;

const STUDENTS_BY_CLASS = {
  'X-IPA-1': [
    { id: 1, nis: '1001', name: 'Budi Santoso', status: 'Hadir' },
    { id: 2, nis: '1002', name: 'Siti Aminah', status: 'Izin' },
    { id: 3, nis: '1003', name: 'Ahmad Rizki', status: 'Sakit' },
    { id: 4, nis: '1004', name: 'Dewi Lestari', status: 'Alpha' },
  ],
  'X-IPA-2': [
    { id: 5, nis: '1011', name: 'Rosa Amelia', status: 'Hadir' },
    { id: 6, nis: '1012', name: 'Fajar Nugroho', status: 'Hadir' },
    { id: 7, nis: '1013', name: 'Nadia Putri', status: 'Izin' },
    { id: 8, nis: '1014', name: 'Arif Hidayat', status: 'Sakit' },
  ],
  'X-IPS-1': [
    { id: 9, nis: '1021', name: 'Rizky Maulana', status: 'Hadir' },
    { id: 10, nis: '1022', name: 'Diana Pratiwi', status: 'Hadir' },
    { id: 11, nis: '1023', name: 'Vino Setiawan', status: 'Izin' },
    { id: 12, nis: '1024', name: 'Lia Sari', status: 'Alpha' },
  ],
};

const ATTENDANCE_OPTIONS = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

const STATUS_CLASS_MAP = {
  Hadir: 'presensi-status--hadir',
  Izin: 'presensi-status--izin',
  Sakit: 'presensi-status--sakit',
  Alpha: 'presensi-status--alpha',
};

export default function PresensiDashboard({ user, onLogout }) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState(CLASS_OPTIONS[0]);
  const [activeTab, setActiveTab] = useState('harian');
  const [students, setStudents] = useState(STUDENTS_BY_CLASS[CLASS_OPTIONS[0]]);

  useEffect(() => {
    setStudents(STUDENTS_BY_CLASS[selectedClass]);
  }, [selectedClass]);

  const monthLabel = new Date(selectedDate).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const handleUpdateStatus = (id, status) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === id ? { ...student, status } : student,
      ),
    );
  };

  const handleSetAllStatus = (status) => {
    setStudents((currentStudents) =>
      currentStudents.map((student) => ({ ...student, status })),
    );
  };

  const handleSave = () => {
    alert('Data presensi berhasil disimpan.');
  };

  const isMonthlySummary = activeTab === 'rekap';

  return (
    <div className="presensi-page">
      <div className="presensi-shell">
        <header className="presensi-topbar">
          <div className="presensi-brand">
            <div className="presensi-logo">M</div>
            <div className="presensi-brand-copy">
              <h1 className="presensi-title">Presensi & Rekap Bulanan</h1>
              <span className="presensi-subtitle">MTsN 1 Mojokerto</span>
            </div>
          </div>

          <div className="presensi-actions">
            <Link to="/dashboard" className="presensi-back-button">Kembali ke Dashboard</Link>
            <span className="presensi-user">Halo, {user?.username ?? 'Admin'} ({user?.role ?? 'User'})</span>
            <button type="button" className="presensi-logout" onClick={onLogout}>Logout</button>
          </div>
        </header>

        <section className="presensi-stats" aria-label="Ringkasan presensi">
          <article className="presensi-stat-card">
            <span className="presensi-stat-label">Total Siswa Aktif</span>
            <strong className="presensi-stat-value">{TOTAL_ACTIVE_STUDENTS}</strong>
            <small className="presensi-stat-meta">{TOTAL_CLASSES} Kelas Terdaftar</small>
          </article>

          <article className="presensi-stat-card">
            <span className="presensi-stat-label">Rata-Rata Kehadiran</span>
            <strong className="presensi-stat-value">{ATTENDANCE_RATE}%</strong>
            <small className="presensi-stat-meta">Bulan {monthLabel}</small>
          </article>

          <article className="presensi-stat-card">
            <span className="presensi-stat-label">Total Sesi Presensi</span>
            <strong className="presensi-stat-value">{TOTAL_SESSIONS}</strong>
            <small className="presensi-stat-meta">Tercatat di Sistem</small>
          </article>
        </section>

        <div className="presensi-mode-switcher">
          <button
            type="button"
            className={activeTab === 'harian' ? 'presensi-mode-button active' : 'presensi-mode-button'}
            onClick={() => setActiveTab('harian')}
          >
            Input Presensi Harian
          </button>
          <button
            type="button"
            className={activeTab === 'rekap' ? 'presensi-mode-button active' : 'presensi-mode-button'}
            onClick={() => setActiveTab('rekap')}
          >
            Rekapitulasi Bulanan
          </button>
        </div>

        <main className="presensi-panel">
          {isMonthlySummary ? (
            <div className="presensi-rekap-panel">
              <div className="presensi-rekap-header">
                <div>
                  <p className="presensi-rekap-eyebrow">Ringkasan Bulanan</p>
                  <h2 className="presensi-rekap-title">{selectedClass}</h2>
                </div>
                <span className="presensi-rekap-period">{monthLabel}</span>
              </div>

              <div className="presensi-rekap-stats">
                <article className="presensi-rekap-card presensi-rekap-card--hadir">
                  <span>Hadir</span>
                  <strong>72%</strong>
                </article>
                <article className="presensi-rekap-card presensi-rekap-card--izin">
                  <span>Izin</span>
                  <strong>14%</strong>
                </article>
                <article className="presensi-rekap-card presensi-rekap-card--alpha">
                  <span>Alpha</span>
                  <strong>8%</strong>
                </article>
              </div>

              <div className="presensi-rekap-table-wrap">
                <table className="presensi-rekap-table">
                  <thead>
                    <tr>
                      <th>Siswa</th>
                      <th>Hadir</th>
                      <th>Izin</th>
                      <th>Sakit</th>
                      <th>Alpha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.status === 'Hadir' ? '✓' : '-'}</td>
                        <td>{student.status === 'Izin' ? '✓' : '-'}</td>
                        <td>{student.status === 'Sakit' ? '✓' : '-'}</td>
                        <td>{student.status === 'Alpha' ? '✓' : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <div className="presensi-control-row">
                <div className="presensi-field">
                  <label htmlFor="attendance-date">Tanggal Presensi</label>
                  <input
                    id="attendance-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>

                <div className="presensi-field">
                  <label htmlFor="attendance-class">Pilih Kelas</label>
                  <select
                    id="attendance-class"
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                  >
                    {CLASS_OPTIONS.map((kelas) => (
                      <option key={kelas} value={kelas}>
                        {kelas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="presensi-mass-action">
                <span className="presensi-mass-label">Set Masal:</span>
                <button type="button" className="presensi-mass-button hadir" onClick={() => handleSetAllStatus('Hadir')}>
                  Semua Hadir
                </button>
                <button type="button" className="presensi-mass-button izin" onClick={() => handleSetAllStatus('Izin')}>
                  Semua Izin
                </button>
              </div>

              <div className="presensi-table-wrap">
                <div className="presensi-table-header">
                  <span>{students.length} Siswa Terdaftar</span>
                </div>

                <table className="presensi-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>NIS</th>
                      <th>Nama Siswa</th>
                      <th>Status Presensi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.nis}</td>
                        <td>
                          <strong>{student.name}</strong>
                        </td>
                        <td>
                          <div className="presensi-option-group">
                            {ATTENDANCE_OPTIONS.map((option) => {
                              const isSelected = student.status === option;

                              return (
                                <button
                                  key={`${student.id}-${option}`}
                                  type="button"
                                  className={
                                    isSelected
                                      ? `presensi-option active ${STATUS_CLASS_MAP[option]}`
                                      : `presensi-option ${STATUS_CLASS_MAP[option]}`
                                  }
                                  onClick={() => handleUpdateStatus(student.id, option)}
                                >
                                  <span className="presensi-option-inner">
                                    {isSelected && <span className="presensi-option-check">✓</span>}
                                    <span>{option}</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="presensi-save-row">
                <button type="button" className="presensi-save-button" onClick={handleSave}>
                  Simpan Ke Database
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
