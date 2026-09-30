import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './AnekdotsDashboard.css';
import { exportWorkbookAsExcel } from '../utils/exportExcel';
import { mapExcelRowToRecord } from '../utils/excelImport';
import { INITIAL_ANEKDOT_FORM } from '../constants';
import {
  fetchAnekdots,
  createAnekdot,
  updateAnekdot,
  deleteAnekdot,
  importAnekdotsFromExcel,
} from '../services';
import AnekdotFormModal from './AnekdotFormModal';

function StatCard({ label, value, meta }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <p className="stat-card__value">{value}</p>
      <span className="stat-card__meta">{meta}</span>
    </div>
  );
}

function ExportButton({
  label,
  onClick,
  variant = 'default',
  loading = false,
  disabled = false,
}) {
  const resolvedLabel = typeof label === 'string' ? { text: label } : label;
  const className = `export-button export-button--${
    variant === 'excel'
      ? 'excel'
      : variant === 'pdf'
        ? 'pdf'
        : variant === 'import'
          ? 'import'
          : 'default'
  }`;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : 'false'}
    >
      <span className="export-button__content">
        <span className={`export-button__icon ${loading ? 'export-button__icon--loading' : ''}`} aria-hidden="true">
          {loading ? '⏳' : resolvedLabel.icon || '•'}
        </span>
        <span>{loading ? resolvedLabel.loadingText || 'Memproses...' : resolvedLabel.text}</span>
      </span>
    </button>
  );
}

export default function AnekdotsDashboard({ user, onLogout, postToGas }) {
  const [anekdots, setAnekdots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_ANEKDOT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState(['Semua']);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [isPrintFormOpen, setIsPrintFormOpen] = useState(false);
  const [printForm, setPrintForm] = useState({
    kepalaMadrasah: '',
    kepalaMadrasahNip: '',
    guruBk: '',
    guruBkNip: '',
  });
  const fileInputRef = useRef(null);
  const classDropdownRef = useRef(null);
  const isActionBusy = loading || exporting || importing;

  const resetForm = () => {
    setFormData(INITIAL_ANEKDOT_FORM);
    setIsEditing(false);
    setIsFormOpen(false);
  };

  const loadAnekdots = async () => {
    setLoading(true);
    try {
      const data = await fetchAnekdots(postToGas);
      setAnekdots(data);
    } catch (err) {
      console.error('Fetch anekdot data error:', err);
      alert(`Terjadi kesalahan koneksi.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnekdots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target)) {
        setIsClassDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (event) => {
    setFormData((prevState) => ({ ...prevState, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    try {
      if (isEditing) {
        await updateAnekdot(postToGas, formData);
      } else {
        await createAnekdot(postToGas, formData);
      }
      resetForm();
      await loadAnekdots();
    } catch (err) {
      console.error('Save data error:', err);
      alert(`Terjadi kesalahan saat menyimpan data.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (!Number.isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const openFormModal = () => {
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    resetForm();
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      Tanggal: formatDateForInput(record.Tanggal),
    });
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus catatan ini?')) return;

    setLoading(true);
    try {
      await deleteAnekdot(postToGas, id);
      await loadAnekdots();
    } catch (err) {
      console.error('Delete data error:', err);
      alert(`Terjadi kesalahan saat menghapus data.\n${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    resetForm();
  };

  const handlePrintFormChange = (event) => {
    const { name, value } = event.target;
    setPrintForm((prevState) => ({ ...prevState, [name]: value }));
  };

  const getExportFilename = (extension) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `catatan-anekdot-${year}-${month}-${day}.${extension}`;
  };

  const formatTimestamp = (dateString) => {
    if (!dateString) return 0;
    const d = new Date(dateString);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  };

  const classOptions = ['Semua', ...Array.from(
    new Set(
      anekdots
        .map((item) => String(item.Kelas || '').trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => {
    if (a === 'Semua') return -1;
    if (b === 'Semua') return 1;
    return a.localeCompare(b, 'id', { sensitivity: 'base' });
  })];

  const handleClassToggle = (kelas) => {
    setSelectedClasses((current) => {
      if (kelas === 'Semua') {
        return ['Semua'];
      }

      const withoutAll = current.filter((item) => item !== 'Semua');
      if (withoutAll.includes(kelas)) {
        const next = withoutAll.filter((item) => item !== kelas);
        return next.length ? next : ['Semua'];
      }

      return [...withoutAll, kelas];
    });
  };

  const filteredAnekdots = [...anekdots]
    .filter((item) => {
      const normalizedClass = String(item.Kelas || '').trim().toLowerCase();
      const normalizedStudent = String(item.NamaSiswa || '').trim().toLowerCase();
      const normalizedSearch = searchStudent.trim().toLowerCase();
      const matchesClass =
        selectedClasses.includes('Semua') ||
        selectedClasses.some((kelas) => normalizedClass === kelas.toLowerCase());
      const matchesSearch = !normalizedSearch || normalizedStudent.includes(normalizedSearch);
      return matchesClass && matchesSearch;
    })
    .sort((a, b) => formatTimestamp(b.Tanggal) - formatTimestamp(a.Tanggal));

  const getExportRows = () => filteredAnekdots.map((item) => [
    item.Tanggal ? formatDateForInput(item.Tanggal) : '',
    item.NamaSiswa || '',
    item.Kelas || '',
    item.Kejadian || '',
    item.Penanganan || '',
    item.Keterangan || '',
  ]);

  const exportToExcel = async () => {
    if (!anekdots.length) {
      alert('Belum ada data yang bisa diekspor.');
      return;
    }

    setExporting(true);
    try {
      const headers = ['Tanggal', 'Nama Siswa', 'Kelas', 'Kejadian', 'Penanganan', 'Keterangan'];
      const rows = [headers, ...getExportRows()];
      await exportWorkbookAsExcel(rows, getExportFilename('xlsx'), 'Catatan Anekdot');
    } catch (error) {
      console.error('Export Excel error:', error);
      alert(error.message || 'Gagal mengekspor file Excel.');
    } finally {
      setExporting(false);
    }
  };

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const buildPrintDocument = (signatureValues = {}) => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const logoUrl = new URL('/logo%20kemenag.svg', window.location.origin).toString();

    const principalName = escapeHtml(signatureValues.kepalaMadrasah || 'Kepala Madrasah');
    const principalNIP = escapeHtml(signatureValues.kepalaMadrasahNip || 'NIP Kepala Madrasah');
    const bkName = escapeHtml(signatureValues.guruBk || 'Guru BK');
    const bkNIP = escapeHtml(signatureValues.guruBkNip || 'NIP Guru BK');

    const rowsHtml = filteredAnekdots
      .slice()
      .sort((a, b) => {
        const classComparison = String(a.Kelas || '').localeCompare(String(b.Kelas || ''), 'id', { sensitivity: 'base' });
        if (classComparison !== 0) return classComparison;
        return formatTimestamp(a.Tanggal) - formatTimestamp(b.Tanggal);
      })
      .map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.Tanggal ? formatDateForInput(item.Tanggal) : ''}</td>
          <td>${escapeHtml(item.NamaSiswa || '')}</td>
          <td>${escapeHtml(item.Kelas || '')}</td>
          <td>${escapeHtml(item.Kejadian || '')}</td>
          <td>${escapeHtml(item.Penanganan || '')}</td>
          <td>${escapeHtml(item.Keterangan || '')}</td>
        </tr>
      `)
      .join('');

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Catatan Anekdot BK</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 36px 42px;
              color: #111827;
              background: #ffffff;
              line-height: 1.5;
            }
            .kop-surat {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 18px;
              border-bottom: 2px solid #111827;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .kop-logo {
              width: 76px;
              height: 76px;
              flex-shrink: 0;
              display: block;
              object-fit: contain;
            }
            .kop-text {
              text-align: center;
              flex: 1;
            }
            .report-brand {
              font-size: 14px;
              font-weight: 700;
              text-align: center;
              text-transform: uppercase;
            }
            .report-title {
              font-size: 20px;
              font-weight: 700;
              text-align: center;
              margin-top: 8px;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .report-subtitle {
              font-size: 12px;
              color: #374151;
              text-align: center;
              margin-top: 0px;
            }
            .report-meta {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              font-size: 12px;
              margin: 14px 0 10px;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 18px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #374151;
              padding: 7px 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #e5e7eb;
              font-weight: 700;
            }
            .signature-wrap {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              gap: 28px;
            }
            .signature-box {
              width: 42%;
              text-align: center;
            }
            .signature-note {
              font-size: 12px;
              text-align: center;
              margin-bottom: 1px;
              font-weight: 700;
            }
            .signature-line {
              height: 100px;
              margin: 0;
            }
            .signature-name {
              min-height: 18px;
              padding: 2px 0 0;
              text-align: center;
              font-size: 12px;
              font-weight: 700;
              color: #111827;
              line-height: 1.3;
            }
            .signature-role {
              font-size: 11px;
              margin-top: 1px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            <img class="kop-logo" src="${logoUrl}" alt="Logo Kemenag Kab. Mojokerto" />
            <div class="kop-text">
              <div class="report-brand">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>
              <div class="report-brand">KANTOR KEMENTERIAN AGAMA KABUPATEN MOJOKERTO</div>
              <div class="report-brand">MADRASAH TSANAWIYAH NEGERI 1</div>
              <div class="report-subtitle">Jalan R.A. Kartini No. 11 Mojosari Telepon (0321) 591141 Kode Pos 61382</div>
              <div class="report-subtitle">e-mail : mtsnegeri1mojokerto@gmail.com Website : www.mtsnegeri1mojokerto.sch.id</div>
            </div>
          </div>

          <div class="report-title">Catatan Anekdot</div>
          <div class="report-meta">
            <div><strong>Tanggal cetak:</strong> ${today}</div>
            <div>Bimbingan Konseling</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Kejadian</th>
                <th>Tindak Lanjut</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>

          <div class="signature-wrap">
            <div class="signature-box">
              <div class="signature-note">Mengetahui</div>
              <div class="signature-role">Kepala Madrasah</div>
              <div class="signature-line"></div>
              <div class="signature-name">${principalName}</div>
              <div class="signature-name">${principalNIP}</div>
            </div>

            <div class="signature-box">
              <div class="signature-note">Mojokerto, ${today}</div>
              <div class="signature-role">Guru BK</div>
              <div class="signature-line"></div>
              <div class="signature-name">${bkName}</div>
              <div class="signature-name">${bkNIP}</div>
            </div>
          </div>
        </body>
      </html>`;
  };

  const handlePrintReport = (signatureValues) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Cetak laporan anekdot');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);

    const printFrame = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (error) {
          console.error('Print iframe error:', error);
        }
        setTimeout(() => iframe.remove(), 1200);
      }, 500);
    };

    iframe.onload = () => printFrame();

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(buildPrintDocument(signatureValues));
    doc.close();
  };

  const exportToPdf = async () => {
    if (!filteredAnekdots.length) {
      alert('Belum ada data yang sesuai dengan kelas dan pencarian siswa saat ini.');
      return;
    }

    setExporting(true);
    try {
      setIsPrintFormOpen(true);
    } catch (error) {
      console.error('Export PDF error:', error);
      alert(error.message || 'Gagal menyiapkan formulir cetak laporan.');
    } finally {
      setTimeout(() => setExporting(false), 200);
    }
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      alert('File yang didukung hanya .xlsx atau .xls');
      event.target.value = '';
      return;
    }

    setImporting(true);

    try {
      const importedCount = await importAnekdotsFromExcel(postToGas, file, mapExcelRowToRecord);
      await loadAnekdots();
      alert(`${importedCount} data berhasil diimpor dari file Excel.`);
    } catch (error) {
      console.error('Import Excel error:', error);
      alert(error.message || 'Gagal mengimpor file Excel.');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard__shell">
        <div className="dashboard__topbar">
          <div className="dashboard__brand">
            <div className="dashboard__logo">BK</div>
            <div>
              <h2 className="dashboard__title">Catatan Anekdot BK</h2>
              <span className="dashboard__subtitle">MTsN 1 Mojokerto</span>
            </div>
          </div>
          <div className="dashboard__actions">
            <Link to="/dashboard" className="dashboard__back-button">Kembali ke Dashboard</Link>
            <span className="dashboard__user">Halo, {user.username} ({user.role})</span>
            <button className="dashboard__logout" onClick={onLogout}>Logout</button>
          </div>
        </div>

        <div className="dashboard__stats">
          <StatCard label="Total Catatan" value={anekdots.length} meta="Data aktif" />
          <StatCard label="Siswa Terdata" value={new Set(anekdots.map((item) => item.NamaSiswa)).size} meta="Unique siswa" />
          <StatCard label="Status Sistem" value="Online" meta="Siap digunakan" />
        </div>

        <div className="dashboard__panel">
          <div className="dashboard__toolbar-section">
            <div className="dashboard__panel-header">
              {/* <h3>Daftar Catatan Anekdot</h3> */}
              <div className="dashboard__panel-actions">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportExcel} />

                <ExportButton
                  label={{ icon: '📥', text: 'Import', loadingText: 'Mengimpor...' }}
                  variant="import"
                  loading={importing}
                  disabled={isActionBusy}
                  onClick={() => fileInputRef.current?.click()}
                />

                <ExportButton
                  label={{ icon: '📄', text: 'LAPORAN', loadingText: 'Membuat PDF...' }}
                  variant="pdf"
                  loading={exporting}
                  disabled={isActionBusy}
                  onClick={exportToPdf}
                />
                <ExportButton
                  label={{ icon: '📊', text: 'Excel', loadingText: 'Mengekspor...' }}
                  variant="excel"
                  loading={exporting}
                  disabled={isActionBusy}
                  onClick={exportToExcel}
                />
                <button type="button" className="dashboard__primary-button" onClick={openFormModal}>
                  + Tambah Catatan
                </button>
              </div>
            </div>
          </div>

          <div className="dashboard__filter-section">
            <div className="dashboard__filters">
              <div className="dashboard__filter-field">
                <label htmlFor="kelas-filter">Kelompok Kelas</label>
                <div className="dashboard__class-dropdown" ref={classDropdownRef}>
                  <button
                    id="kelas-filter"
                    type="button"
                    className="dashboard__class-trigger"
                    onClick={() => setIsClassDropdownOpen((prev) => !prev)}
                  >
                    <span>
                      {selectedClasses.includes('Semua')
                        ? 'Semua Kelas'
                        : selectedClasses.length
                          ? selectedClasses.join(', ')
                          : 'Pilih kelas'}
                    </span>
                    <span className="dashboard__class-trigger-icon">▾</span>
                  </button>

                  {isClassDropdownOpen && (
                    <div className="dashboard__class-menu" role="listbox" aria-multiselectable="true">
                      {classOptions.map((kelas) => {
                        const isSelected = selectedClasses.includes(kelas);

                        return (
                          <button
                            key={kelas}
                            type="button"
                            className={`dashboard__class-option ${isSelected ? 'dashboard__class-option--selected' : ''}`}
                            onClick={() => {
                              handleClassToggle(kelas);
                              setIsClassDropdownOpen(false);
                            }}
                          >
                            <span className="dashboard__class-option-check">{isSelected ? '✓' : ''}</span>
                            <span>{kelas === 'Semua' ? 'Semua Kelas' : kelas}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dashboard__filter-field dashboard__filter-field--search">
              <label htmlFor="siswa-search">Pencarian Siswa</label>
              <input
                id="siswa-search"
                type="text"
                className="dashboard__filter-input"
                value={searchStudent}
                onChange={(event) => setSearchStudent(event.target.value)}
                placeholder="Contoh: Ahmad, Siti, Budi"
              />
            </div>

            {/* <div className="dashboard__group-summary">
              {classOptions.filter((kelas) => kelas !== 'Semua').map((kelas) => (
                <button
                  key={kelas}
                  type="button"
                  className={`dashboard__group-chip ${selectedClasses.includes(kelas) ? 'dashboard__group-chip--active' : ''}`}
                  onClick={() => {
                    if (selectedClasses.includes(kelas)) {
                      setSelectedClasses((current) => current.filter((item) => item !== kelas));
                    } else {
                      setSelectedClasses((current) => {
                        if (kelas === 'Semua') return ['Semua'];
                        return [...current.filter((item) => item !== 'Semua'), kelas];
                      });
                    }
                  }}
                >
                  {kelas}
                </button>
              ))}
            </div> */}
          </div>

          <div className="dashboard__table-section">
            <div className="dashboard__table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Tanggal</th>
                    <th>Siswa</th>
                    <th>Kelas</th>
                    <th>Kejadian</th>
                    <th>Tindak Lanjut</th>
                    <th>Ket.</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                {loading ? (
                  <tbody>
                    <tr>
                      <td colSpan="8" className="dashboard__status">Memuat data...</td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody>
                    {filteredAnekdots.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="dashboard__status">Tidak ada data pada kelas atau pencarian ini.</td>
                      </tr>
                    ) : (
                      filteredAnekdots.map((r, index) => (
                        <tr key={`${r.ID || 'row'}-${index}`}>
                          <td>{index + 1}</td>
                          <td>{formatDateForInput(r.Tanggal)}</td>
                          <td>{r.NamaSiswa}</td>
                          <td>{r.Kelas}</td>
                          <td className="dashboard__table-text">{r.Kejadian}</td>
                          <td className="dashboard__table-text">{r.Penanganan}</td>
                          <td className="dashboard__table-text">{r.Keterangan}</td>
                          <td>
                            <div className="dashboard__table-actions">
                              <button type="button" className="dashboard__table-action" onClick={() => handleEdit(r)}>
                                ✏️ Edit
                              </button>

                              {user.role === 'superuser' && (
                                <button type="button" className="dashboard__danger-button" onClick={() => handleDelete(r.ID)}>
                                  🗑️ Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {isPrintFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000,
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
            padding: '24px',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>ISI PENANDA TANGAN SEBELUM DICETAK</h3>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nama Kepala Madrasah</label>
            <input
              name="kepalaMadrasah"
              type="text"
              value={printForm.kepalaMadrasah}
              onChange={handlePrintFormChange}
              placeholder="Masukkan nama kepala madrasah"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '14px' }}
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>NIP Kepala Madrasah</label>
            <input
              name="kepalaMadrasahNip"
              type="text"
              value={printForm.kepalaMadrasahNip}
              onChange={handlePrintFormChange}
              placeholder="Masukkan NIP kepala madrasah"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '14px' }}
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Nama Guru BK</label>
            <input
              name="guruBk"
              type="text"
              value={printForm.guruBk}
              onChange={handlePrintFormChange}
              placeholder="Masukkan nama guru BK"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '14px' }}
            />

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>NIP Guru BK</label>
            <input
              name="guruBkNip"
              type="text"
              value={printForm.guruBkNip}
              onChange={handlePrintFormChange}
              placeholder="Masukkan NIP guru BK"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '18px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsPrintFormOpen(false)}
                style={{ flex: 1, border: '1px solid #cbd5e1', background: '#ffffff', color: '#111827', fontWeight: 700, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextPrintForm = {
                    kepalaMadrasah: printForm.kepalaMadrasah.trim(),
                    kepalaMadrasahNip: printForm.kepalaMadrasahNip.trim(),
                    guruBk: printForm.guruBk.trim(),
                    guruBkNip: printForm.guruBkNip.trim(),
                  };

                  setIsPrintFormOpen(false);
                  setPrintForm(nextPrintForm);
                  handlePrintReport(nextPrintForm);
                }}
                style={{ flex: 1, border: 'none', background: '#0f172a', color: '#ffffff', fontWeight: 700, borderRadius: '8px', padding: '10px 14px', cursor: 'pointer' }}
              >
                Cetak Lembar
              </button>
            </div>
          </div>
        </div>
      )}

      <AnekdotFormModal
        isOpen={isFormOpen}
        isEditing={isEditing}
        formData={formData}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        onChange={handleFieldChange}
        onCancel={cancelEdit}
      />
    </div>
  );
}
