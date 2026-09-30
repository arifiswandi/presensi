import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './PresensiDashboard.css';
import {
  ATTENDANCE_OPTIONS,
  STATUS_CLASS_MAP,
} from '../constants';
import {
  fetchMonthlySummary,
  fetchPresensiStudents,
  fetchPresensiStatusByDate,
  savePresensi,
} from '../services';

export default function PresensiDashboard({ user, onLogout }) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState('harian');
  const [students, setStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [monthlySummaryRows, setMonthlySummaryRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const classOptions = useMemo(() => Object.keys(studentsByClass), [studentsByClass]);
  const totalClasses = classOptions.length;
  const totalActiveStudents = Object.values(studentsByClass).reduce((sum, group) => sum + group.length, 0);

  const loadStudents = async () => {
    try {
      setLoadError('');
      const studentRows = await fetchPresensiStudents();

      const mapped = studentRows.reduce((acc, student) => {
        const kelas = student.kelas || 'Umum';
        if (!acc[kelas]) acc[kelas] = [];
        acc[kelas].push({
          id: student.id,
          nis: student.nis,
          name: student.name,
          status: 'Hadir',
        });
        return acc;
      }, {});

      const classKeys = Object.keys(mapped);
      setStudentsByClass(mapped);

      if (classKeys.length) {
        setSelectedClass((current) => (classKeys.includes(current) ? current : classKeys[0]));
      } else {
        setSelectedClass('');
      }
    } catch (error) {
      console.error('Gagal memuat data siswa:', error);
      setLoadError('Gagal memuat daftar siswa dari server.');
      setStudentsByClass({});
      setSelectedClass('');
    }
  };

  const refreshAttendanceStatus = async (currentClass = selectedClass, currentDate = selectedDate) => {
    if (!currentClass || !currentDate) {
      setStudents([]);
      return;
    }

    try {
      setLoadError('');
      const statusByNis = await fetchPresensiStatusByDate({
        tanggal: currentDate,
        kelas: currentClass,
      });

      const baseStudents = studentsByClass[currentClass] || [];
      const updatedStudents = baseStudents.map((student) => ({
        ...student,
        status: statusByNis[student.nis] || 'Hadir',
      }));

      setStudents(updatedStudents);
      setStudentsByClass((currentMap) => ({
        ...currentMap,
        [currentClass]: updatedStudents,
      }));
    } catch (error) {
      console.error('Gagal memuat status presensi terdaftar:', {
        currentClass,
        currentDate,
        error: error?.message || error,
      });
      setLoadError('Gagal memuat status presensi dari spreadsheet.');
      setStudents(studentsByClass[currentClass] || []);
    }
  };

  useEffect(() => {
    loadStudents();
    const onFocus = () => loadStudents();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    refreshAttendanceStatus(selectedClass, selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDate]);

  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setMonthlySummaryRows([]);
      return;
    }

    loadMonthlySummary(selectedClass, selectedDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDate]);

  const monthLabel = new Date(selectedDate).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const effectiveDaysInMonth = useMemo(() => {
    if (!selectedClass) return 0;

    const sourceRows = monthlySummaryRows.length ? monthlySummaryRows : students;
    if (!sourceRows.length) return 0;

    const totalAttendanceEntries = sourceRows.reduce((sum, row) => {
      const statusKeys = ['Hadir', 'Izin', 'Sakit', 'Alpha'];
      const rowTotal = statusKeys.reduce((innerSum, status) => {
        const value = Number(row?.[status] ?? 0);
        return innerSum + (Number.isNaN(value) ? 0 : value);
      }, 0);

      return sum + rowTotal;
    }, 0);

    const validStudentCount = sourceRows.filter((row) => row?.nama || row?.name || row?.nis).length || 1;

    if (!totalAttendanceEntries) return 0;

    return Math.max(Math.round(totalAttendanceEntries / validStudentCount), 1);
  }, [monthlySummaryRows, selectedClass, students]);

  const monthlyStatusCounts = useMemo(() => {
    const base = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };
    const sourceRows = monthlySummaryRows.length ? monthlySummaryRows : students;

    sourceRows.forEach((row) => {
      Object.keys(base).forEach((status) => {
        const value = Number(row?.[status] ?? 0);
        if (!Number.isNaN(value)) {
          base[status] += value;
        }
      });
    });

    return base;
  }, [monthlySummaryRows, students]);

  const selectedClassStudentCount = monthlySummaryRows.length ? monthlySummaryRows.length : students.length;
  const effectiveAttendanceDenominator = Math.max(selectedClassStudentCount * effectiveDaysInMonth, 1);
  const totalMonthlyStatus = Object.values(monthlyStatusCounts).reduce((sum, value) => sum + value, 0);
  const attendanceRate = totalMonthlyStatus ? (monthlyStatusCounts.Hadir / effectiveAttendanceDenominator) * 100 : 0;
  const monthlyStatusBreakdown = useMemo(() => {
    const entries = Object.entries(monthlyStatusCounts);

    return entries.reduce((acc, [status, total]) => {
      acc[status] = effectiveAttendanceDenominator ? (total / effectiveAttendanceDenominator) * 100 : 0;
      return acc;
    }, {});
  }, [effectiveAttendanceDenominator, monthlyStatusCounts]);

  const loadMonthlySummary = async (currentClass = selectedClass, currentDate = selectedDate) => {
    if (!currentClass || !currentDate) {
      setMonthlySummaryRows([]);
      return;
    }

    try {
      const dateObj = new Date(`${currentDate}T00:00:00`);
      const bulan = dateObj.getMonth() + 1;
      const tahun = dateObj.getFullYear();

      const summaryRows = await fetchMonthlySummary({
        kelas: currentClass,
        bulan,
        tahun,
      });

      setMonthlySummaryRows(summaryRows);
    } catch (error) {
      console.error('Gagal memuat rekap bulan dari spreadsheet:', error);
      setMonthlySummaryRows([]);
    }
  };

  const monthlyTableRows = activeTab === 'rekap' ? monthlySummaryRows : students;

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

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = {
        tanggal: selectedDate,
        kelas: selectedClass,
        absensiData: students.map((student) => ({
          nis: student.nis,
          nama: student.name,
          status: student.status,
        })),
      };

      await savePresensi(payload);
      alert('Data presensi berhasil disimpan.');
    } catch (error) {
      console.error('Gagal menyimpan presensi:', error);
      alert(error.message || 'Gagal menyimpan data presensi.');
    } finally {
      setSaving(false);
    }
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
            <strong className="presensi-stat-value">{totalActiveStudents}</strong>
            <small className="presensi-stat-meta">{totalClasses} Kelas Terdaftar</small>
          </article>

          <article className="presensi-stat-card">
            <span className="presensi-stat-label">Rata-Rata Kehadiran</span>
            <strong className="presensi-stat-value">{Number(attendanceRate.toFixed(1))}%</strong>
            <div className="presensi-stat-effective-box">
              <span>Hari efektif</span>
              <strong>{effectiveDaysInMonth} hari</strong>
            </div>
            <small className="presensi-stat-meta">Bulan {monthLabel}</small>
            <small className="presensi-stat-meta presensi-stat-meta--sub">Berdasarkan data absensi</small>
            <div className="presensi-stat-breakdown">
              {Object.entries(monthlyStatusBreakdown).map(([status, value]) => (
                <span key={status} className="presensi-stat-breakdown-item">
                  {status}: {Number(value.toFixed(1))}%
                </span>
              ))}
            </div>
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
                  <strong>{monthlyStatusCounts.Hadir}</strong>
                  <small>{Number((monthlyStatusBreakdown.Hadir ?? 0).toFixed(1))}%</small>
                </article>
                <article className="presensi-rekap-card presensi-rekap-card--izin">
                  <span>Izin</span>
                  <strong>{monthlyStatusCounts.Izin}</strong>
                  <small>{Number((monthlyStatusBreakdown.Izin ?? 0).toFixed(1))}%</small>
                </article>
                <article className="presensi-rekap-card presensi-rekap-card--sakit">
                  <span>Sakit</span>
                  <strong>{monthlyStatusCounts.Sakit}</strong>
                  <small>{Number((monthlyStatusBreakdown.Sakit ?? 0).toFixed(1))}%</small>
                </article>
                <article className="presensi-rekap-card presensi-rekap-card--alpha">
                  <span>Alpha</span>
                  <strong>{monthlyStatusCounts.Alpha}</strong>
                  <small>{Number((monthlyStatusBreakdown.Alpha ?? 0).toFixed(1))}%</small>
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
                    {monthlyTableRows.map((student) => (
                      <tr key={student.id ?? student.nis ?? student.nama ?? student.name}>
                        <td>{student.nama ?? student.name}</td>
                        <td>{Number(student.Hadir ?? 0)}</td>
                        <td>{Number(student.Izin ?? 0)}</td>
                        <td>{Number(student.Sakit ?? 0)}</td>
                        <td>{Number(student.Alpha ?? 0)}</td>
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
                    {classOptions.length ? (
                      classOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>
                          {kelas}
                        </option>
                      ))
                    ) : (
                      <option value="">Tidak ada kelas</option>
                    )}
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

                {!selectedClass && !loadError && <p className="presensi-error-text">Memuat data kelas...</p>}

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

              {loadError && <p className="presensi-error-text">{loadError}</p>}

              <div className="presensi-save-row">
                <button type="button" className="presensi-save-button" onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan Ke Database'}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
