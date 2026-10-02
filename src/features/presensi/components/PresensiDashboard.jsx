import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './PresensiDashboard.css';
import {
  ATTENDANCE_OPTIONS,
  STATUS_CLASS_MAP,
} from '../constants';
import {
  downloadSiswaImportTemplate,
  fetchMonthlySummary,
  fetchPresensiByKelasBulan,
  fetchPresensiStudents,
  importSiswaFromExcelFile,
  savePresensi,
} from '../services';

const VALID_ATTENDANCE_STATUSES = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

const normalizeStudentStatus = (value) => {
  if (!value || !VALID_ATTENDANCE_STATUSES.includes(value)) {
    return '';
  }

  return value;
};

const getLocalDateString = (date = new Date()) => {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return local.toISOString().slice(0, 10);
};

const hasSameStudentList = (left = [], right = []) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((student, index) => {
    const target = right[index] || {};
    return student.id === target.id
      && student.nis === target.nis
      && student.name === target.name
      && student.status === target.status;
  });
};

export default function PresensiDashboard({ user, onLogout }) {
  const today = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState('');
  const [activeTab, setActiveTab] = useState('harian');
  const [students, setStudents] = useState([]);
  const [studentsByClass, setStudentsByClass] = useState({});
  const [monthlySummaryRows, setMonthlySummaryRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [importingStudents, setImportingStudents] = useState(false);
  const [isRefreshingClassData, setIsRefreshingClassData] = useState(false);
  const studentFileInputRef = useRef(null);
  const [loadError, setLoadError] = useState('');
  const pendingClassFetchesRef = useRef(new Map());
  const studentsByClassRef = useRef(studentsByClass);
  const selectedClassRef = useRef(selectedClass);
  const selectedDateRef = useRef(selectedDate);
  const lastStudentsLoadRef = useRef(0);

  useEffect(() => {
    studentsByClassRef.current = studentsByClass;
  }, [studentsByClass]);

  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);

  const classOptions = useMemo(() => Object.keys(studentsByClass), [studentsByClass]);
  const totalClasses = classOptions.length;
  const totalActiveStudents = Object.values(studentsByClass).reduce((sum, group) => sum + group.length, 0);

  const refreshSelectedClassData = useCallback(async ({ className = selectedClassRef.current, targetDate = selectedDateRef.current, force = false } = {}) => {
    if (!className || !targetDate) {
      setStudents([]);
      setMonthlySummaryRows([]);
      return [];
    }

    const requestKey = `${className}|${targetDate}`;
    if (!force && pendingClassFetchesRef.current.has(requestKey)) {
      return pendingClassFetchesRef.current.get(requestKey);
    }

    const dateObj = new Date(`${targetDate}T00:00:00`);
    const bulan = dateObj.getMonth() + 1;
    const tahun = dateObj.getFullYear();

    const requestPromise = (async () => {
      try {
        setLoadError('');
        setIsRefreshingClassData(true);

        const [classMonthData, summaryRows] = await Promise.all([
          fetchPresensiByKelasBulan({
            kelas: className,
            bulan,
            tahun,
          }),
          fetchMonthlySummary({
            kelas: className,
            bulan,
            tahun,
          }),
        ]);

        const statusByNis = classMonthData?.[targetDate] || {};
        const currentStudentsForClass = studentsByClassRef.current[className] || [];

        const baseStudents = currentStudentsForClass.map((student) => ({
          ...student,
          status: normalizeStudentStatus(statusByNis[student.nis] || student.status),
        }));

        setStudents((currentStudents) => {
          if (hasSameStudentList(currentStudents, baseStudents)) {
            return currentStudents;
          }
          return baseStudents;
        });
        setStudentsByClass((currentMap) => {
          const previousClassStudents = currentMap[className] || [];
          if (hasSameStudentList(previousClassStudents, baseStudents)) {
            return currentMap;
          }
          return {
            ...currentMap,
            [className]: baseStudents,
          };
        });
        setMonthlySummaryRows((currentSummaryRows) => {
          const nextSummaryRows = Array.isArray(summaryRows) ? summaryRows : [];
          if (JSON.stringify(currentSummaryRows) === JSON.stringify(nextSummaryRows)) {
            return currentSummaryRows;
          }
          return nextSummaryRows;
        });
        return baseStudents;
      } catch (error) {
        console.error('Gagal memuat data presensi kelas:', {
          className,
          targetDate,
          error: error?.message || error,
        });

        setLoadError('Gagal memuat data presensi dari spreadsheet.');
        const fallbackStudents = studentsByClassRef.current[className] || [];
        setStudents(fallbackStudents);
        setMonthlySummaryRows([]);
        return fallbackStudents;
      } finally {
        setIsRefreshingClassData(false);
        pendingClassFetchesRef.current.delete(requestKey);
      }
    })();

    pendingClassFetchesRef.current.set(requestKey, requestPromise);
    return requestPromise;
  }, []);

  const loadStudents = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    if (!force && now - lastStudentsLoadRef.current < 30000) {
      return;
    }

    try {
      setLoadError('');
      setIsRefreshingClassData(true);
      const studentRows = await fetchPresensiStudents();

      if (!studentRows.length) {
        setStudentsByClass({});
        setStudents([]);
        setSelectedClass('');
        lastStudentsLoadRef.current = now;
        setIsRefreshingClassData(false);
        return;
      }

      const mapped = studentRows.reduce((acc, student) => {
        const kelas = student.kelas || 'Umum';
        if (!acc[kelas]) acc[kelas] = [];
        acc[kelas].push({
          id: student.id,
          nis: student.nis,
          name: student.name,
          status: '',
        });
        return acc;
      }, {});

      const classKeys = Object.keys(mapped);
      setStudentsByClass(mapped);

      if (classKeys.length) {
        const currentClass = selectedClassRef.current;
        const currentDate = selectedDateRef.current;
        const nextClass = classKeys.includes(currentClass) ? currentClass : classKeys[0];

        if (selectedClassRef.current !== nextClass) {
          setSelectedClass(nextClass);
        }

        await refreshSelectedClassData({ className: nextClass, targetDate: currentDate || today });
      } else {
        setSelectedClass('');
      }

      lastStudentsLoadRef.current = Date.now();
    } catch (error) {
      console.error('Gagal memuat data siswa:', error);
      setLoadError('Gagal memuat daftar siswa dari server.');
      setStudentsByClass({});
      setStudents([]);
      setSelectedClass('');
    } finally {
      setIsRefreshingClassData(false);
    }
  }, [refreshSelectedClassData, today]);

  useEffect(() => {
    loadStudents({ force: true });
    const onFocus = () => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastStudentsLoadRef.current;
      const isTabStale = timeSinceLastRefresh >= 120000;
      const hasPendingRequest = pendingClassFetchesRef.current.size > 0;

      if (isTabStale && !hasPendingRequest) {
        loadStudents({ force: true });
      }
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadStudents]);

  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setStudents([]);
      setMonthlySummaryRows([]);
      setIsRefreshingClassData(false);
      return undefined;
    }

    const debounceTimer = window.setTimeout(() => {
      const baseStudents = studentsByClassRef.current[selectedClass] || [];
      setStudents(baseStudents.map((student) => ({
        ...student,
        status: normalizeStudentStatus(student.status),
      })));
      setIsRefreshingClassData(true);

      refreshSelectedClassData({
        className: selectedClass,
        targetDate: selectedDate,
      }).then((updatedStudents) => {
        setStudents(updatedStudents);
      }).catch((error) => {
        console.error('Gagal memuat data presensi kelas:', {
          selectedClass,
          selectedDate,
          error: error?.message || error,
        });
        setLoadError('Gagal memuat data presensi dari spreadsheet.');
        setStudents(baseStudents);
        setMonthlySummaryRows([]);
      });
    }, 350);

    return () => window.clearTimeout(debounceTimer);
  }, [refreshSelectedClassData, selectedClass, selectedDate]);

  const handleRefresh = useCallback(async () => {
    if (!selectedClass || !selectedDate) {
      await loadStudents({ force: true });
      return;
    }

    await refreshSelectedClassData({
      className: selectedClass,
      targetDate: selectedDate,
      force: true,
    });
  }, [loadStudents, refreshSelectedClassData, selectedClass, selectedDate]);

  const monthLabel = new Date(selectedDate).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const effectiveDaysInMonth = useMemo(() => {
    if (!selectedClass || !monthlySummaryRows.length) return 0;

    const validStudentCount = monthlySummaryRows.filter((row) => row?.nama || row?.name || row?.nis).length || 1;
    const totalAttendanceEntries = monthlySummaryRows.reduce((sum, row) => {
      const rowTotal = Number(row?.Total ?? 0);
      const statusKeys = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

      if (rowTotal > 0) {
        return sum + rowTotal;
      }

      const fallbackTotal = statusKeys.reduce((innerSum, status) => {
        const value = Number(row?.[status] ?? 0);
        return innerSum + (Number.isNaN(value) ? 0 : value);
      }, 0);

      return sum + fallbackTotal;
    }, 0);

    if (!totalAttendanceEntries) return 0;

    return Math.max(Math.round(totalAttendanceEntries / validStudentCount), 1);
  }, [monthlySummaryRows, selectedClass]);

  const monthlyStatusCounts = useMemo(() => {
    const base = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0 };

    monthlySummaryRows.forEach((row) => {
      Object.keys(base).forEach((status) => {
        const value = Number(row?.[status] ?? 0);
        if (!Number.isNaN(value)) {
          base[status] += value;
        }
      });
    });

    return base;
  }, [monthlySummaryRows]);

  const selectedClassStudentCount = Math.max(monthlySummaryRows.length || students.length || 1, 1);
  const effectiveAttendanceDenominator = monthLabel && monthlySummaryRows.length
    ? Math.max(selectedClassStudentCount * effectiveDaysInMonth, 1)
    : Math.max(selectedClassStudentCount, 1);
  const totalMonthlyStatus = Object.values(monthlyStatusCounts).reduce((sum, value) => sum + value, 0);
  const attendanceRate = totalMonthlyStatus && effectiveAttendanceDenominator
    ? (monthlyStatusCounts.Hadir / effectiveAttendanceDenominator) * 100
    : 0;
  const monthlyStatusBreakdown = useMemo(() => {
    const entries = Object.entries(monthlyStatusCounts);

    return entries.reduce((acc, [status, total]) => {
      acc[status] = effectiveAttendanceDenominator ? (total / effectiveAttendanceDenominator) * 100 : 0;
      return acc;
    }, {});
  }, [effectiveAttendanceDenominator, monthlyStatusCounts]);

  const monthlyTableRows = useMemo(() => (
    activeTab === 'rekap' ? monthlySummaryRows : students
  ), [activeTab, monthlySummaryRows, students]);

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
        presensiData: students.map((student) => ({
          nis: student.nis,
          nama: student.name,
          status: student.status,
        })),
      };

      await savePresensi(payload);
      await refreshSelectedClassData({ className: selectedClass, targetDate: selectedDate });
      alert('Data presensi berhasil disimpan dan status diperbarui.');
    } catch (error) {
      console.error('Gagal menyimpan presensi:', error);
      alert(error.message || 'Gagal menyimpan data presensi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadStudentTemplate = async () => {
    try {
      const result = await downloadSiswaImportTemplate();
      alert(result?.message || 'Template Excel siswa berhasil diunduh.');
    } catch (error) {
      console.error('Gagal mengunduh template siswa:', error);
      alert(error.message || 'Gagal mengunduh template siswa.');
    }
  };

  const handleImportStudentsFromExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportingStudents(true);
      const result = await importSiswaFromExcelFile(file);
      alert(result?.message || 'Data siswa berhasil diimpor.');
      await loadStudents({ force: true });
      if (selectedClass && selectedDate) {
        await refreshSelectedClassData({ className: selectedClass, targetDate: selectedDate });
      }
    } catch (error) {
      console.error('Gagal mengimpor data siswa:', error);
      alert(error.message || 'Gagal mengimpor data siswa.');
    } finally {
      setImportingStudents(false);
      event.target.value = '';
    }
  };

  const isMonthlySummary = activeTab === 'rekap';

  return (
    <div className="presensi-page">
      {isRefreshingClassData && (
        <div className="presensi-page-loading" aria-live="polite" aria-busy="true">
          <div className="presensi-page-loading-card">
            <span className="presensi-page-loading-spinner" aria-hidden="true" />
            <span>Memuat data kelas...</span>
          </div>
        </div>
      )}

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
              <span className="presensi-stat-effective-label">Hari efektif (berdasarkan data absensi)</span>
              <div className="presensi-stat-effective-value-row">
                <strong className="presensi-stat-effective-value">{effectiveDaysInMonth}</strong>
                <span className="presensi-stat-effective-unit">hari</span>
              </div>
            </div>
            <small className="presensi-stat-meta">Bulan {monthLabel}</small>
            <small className="presensi-stat-meta presensi-stat-meta--sub">Berdasarkan data presensi</small>
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

                <div className="presensi-field presensi-field--action">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="presensi-save-button presensi-save-button--secondary"
                    onClick={handleRefresh}
                    disabled={isRefreshingClassData}
                  >
                    {isRefreshingClassData ? 'Memuat...' : 'Segarkan'}
                  </button>
                </div>

                <div className="presensi-field presensi-field--action">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="presensi-save-button presensi-save-button--secondary"
                    onClick={handleDownloadStudentTemplate}
                  >
                    Download Template
                  </button>
                </div>

                <div className="presensi-field presensi-field--action">
                  <label>&nbsp;</label>
                  <button
                    type="button"
                    className="presensi-save-button presensi-save-button--secondary"
                    onClick={() => studentFileInputRef.current?.click()}
                    disabled={importingStudents}
                  >
                    {importingStudents ? 'Mengimpor...' : 'Import Excel Siswa'}
                  </button>
                  <input
                    ref={studentFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    hidden
                    onChange={handleImportStudentsFromExcel}
                  />
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
                    {students.map((student, index) => {
                      const statusLabel = normalizeStudentStatus(student.status);

                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.nis}</td>
                          <td>
                            <strong>{student.name}</strong>
                          </td>
                          <td>
                            <div className="presensi-option-group">
                              {statusLabel && (
                                <div className="presensi-status-label" aria-live="polite">
                                  {/* {statusLabel} */}
                                </div>
                              )}
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
                      );
                    })}
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
