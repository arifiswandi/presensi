import { postToGas } from './gasPresensiService';

const readWorkbookRowsFromFile = async (file) => {
  if (!file) {
    throw new Error('File Excel belum dipilih.');
  }

  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('File Excel tidak memiliki sheet yang valid.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('File Excel tidak berisi data.');
  }

  return rows;
};

// Struktur response GAS dari `getSiswa`:
// [id, kelas, nis, nama, jenisKelamin]
const normalizeRows = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.rows)) return value.rows;
  if (Array.isArray(value.records)) return value.records;
  if (Array.isArray(value.siswa)) return value.siswa;
  if (Array.isArray(value.items)) return value.items;

  if (Array.isArray(value.data?.data)) return value.data.data;
  if (Array.isArray(value.data?.rows)) return value.data.rows;
  if (Array.isArray(value.data?.records)) return value.data.records;

  return [];
};

const normalizeClassName = (value = '') => String(value ?? '')
  .replace(/[^A-Za-z0-9]+/g, '')
  .toUpperCase();

const normalizeJenisKelamin = (value) => {
  const text = String(value ?? '').trim().toLowerCase();

  if (!text) {
    return '';
  }

  if (['l', 'lk', 'laki', 'laki-laki', 'male', 'm'].includes(text)) {
    return 'L';
  }

  if (['p', 'pr', 'perempuan', 'female', 'f', 'wanita'].includes(text)) {
    return 'P';
  }

  const firstLetter = text.charAt(0);
  if (firstLetter === 'l') {
    return 'L';
  }
  if (firstLetter === 'p') {
    return 'P';
  }

  return String(value ?? '').trim().toUpperCase();
};

const normalizeStudent = (item, index) => {
  const jenisKelamin = normalizeJenisKelamin(
    item?.jenisKelamin ?? item?.gender ?? item?.JenisKelamin ?? item?.jk ?? ''
  );
  const kelas = normalizeClassName(item?.kelas ?? item?.Kelas ?? item?.kelasSiswa ?? item?.KelasSiswa ?? '');

  return {
    id: item?.id ?? item?.nis ?? item?.NIS ?? `${kelas || 'siswa'}-${index}`,
    nis: item?.nis ?? item?.NIS ?? String(index + 1),
    name: item?.nama ?? item?.name ?? item?.NamaSiswa ?? item?.Nama ?? 'Siswa',
    kelas,
    jenisKelamin,
    gender: jenisKelamin,
    status: item?.status ?? '',
  };
};

export const fetchPresensiStudents = async ({ tanggal } = {}) => {
  const data = await postToGas({ action: 'getSiswa', tanggal }, 'Memuat daftar siswa');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal memuat daftar siswa.');
  }

  const rows = normalizeRows(data);
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => normalizeStudent(item, index));
};

export const fetchPresensiStatusByDate = async ({ tanggal, kelas }) => {
  try {
    const normalizedKelas = normalizeClassName(kelas);
    const data = await postToGas({ action: 'getPresensiByDate', tanggal, kelas: normalizedKelas }, 'Memuat status presensi');

    if (data.success === false) {
      throw new Error(data.message || 'Gagal memuat status presensi.');
    }

    return data.data || {};
  } catch (error) {
    console.error('fetchPresensiStatusByDate failed:', {
      tanggal,
      kelas,
      error: error?.message || error,
    });
    throw error;
  }
};

export const fetchPresensiByKelasBulan = async ({ kelas, bulan, tahun }) => {
  try {
    const normalizedKelas = normalizeClassName(kelas);
    const data = await postToGas(
      { action: 'getPresensiByKelasBulan', kelas: normalizedKelas, bulan, tahun },
      'Memuat data presensi per kelas dan bulan'
    );

    if (data.success === false) {
      throw new Error(data.message || 'Gagal memuat data presensi per kelas dan bulan.');
    }

    return data.data || {};
  } catch (error) {
    console.error('fetchPresensiByKelasBulan failed:', {
      kelas,
      bulan,
      tahun,
      error: error?.message || error,
    });
    throw error;
  }
};

export const fetchPresensiKelasBulan = fetchPresensiByKelasBulan;

export const fetchMonthlySummary = async ({ kelas, bulan, tahun }) => {
  try {
    const normalizedKelas = normalizeClassName(kelas);
    const data = await postToGas({ action: 'getRekap', kelas: normalizedKelas, bulan, tahun }, 'Memuat rekap bulanan');

    if (data.success === false) {
      throw new Error(data.message || 'Gagal memuat rekap bulanan.');
    }

    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('fetchMonthlySummary failed:', {
      kelas,
      bulan,
      tahun,
      error: error?.message || error,
    });
    throw error;
  }
};

export const savePresensi = async (payload = {}) => {
  const normalizedPayload = {
    action: 'simpanPresensi',
    tanggal: payload.tanggal,
    kelas: normalizeClassName(payload.kelas),
    presensiData: Array.isArray(payload.presensiData) ? payload.presensiData : [],
  };

  const data = await postToGas(normalizedPayload, 'Simpan data presensi');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal menyimpan data presensi.');
  }

  return data;
};

export const createSiswaSpreadsheet = async () => {
  const data = await postToGas({ action: 'createSiswaSpreadsheet' }, 'Membuat spreadsheet siswa');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal membuat spreadsheet siswa.');
  }

  return data;
};

export const importSiswaData = async (siswaData = []) => {
  const data = await postToGas(
    { action: 'importSiswa', siswaData: Array.isArray(siswaData) ? siswaData : [] },
    'Mengimpor data siswa'
  );

  if (data.success === false) {
    throw new Error(data.message || 'Gagal mengimpor data siswa.');
  }

  return data;
};

const normalizeImportHeaderName = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const validateStudentImportRows = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('File Excel tidak berisi data siswa.');
  }

  const sampleRow = rows[0];
  const headerNames = Object.keys(sampleRow || {}).map((key) => normalizeImportHeaderName(key));
  const requiredKeys = ['id', 'kelas', 'nis', 'nama'];
  const missingHeaders = requiredKeys.filter((key) => !headerNames.includes(key));

  if (missingHeaders.length) {
    throw new Error(
      'Format file Excel tidak sesuai. Gunakan template yang benar dengan kolom: ID, KELAS, NIS, NAMA, L/P.'
    );
  }

  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row, index) => {
      const cellValue = (candidates) => {
        const direct = candidates.find((candidate) => {
          const source = row[candidate];
          return source !== undefined && source !== null && String(source).trim() !== '';
        });

        if (direct) {
          return row[direct];
        }

        const normalizedRow = Object.keys(row).reduce((acc, key) => {
          acc[normalizeImportHeaderName(key)] = row[key];
          return acc;
        }, {});

        const mapped = candidates.find((candidate) => {
          const source = normalizedRow[candidate];
          return source !== undefined && source !== null && String(source).trim() !== '';
        });

        if (mapped) {
          return normalizedRow[mapped];
        }

        return '';
      };

      const kelas = String(cellValue(['KELAS', 'kelas', 'Kelas']) ?? '').trim();
      const nis = String(cellValue(['NIS', 'nis', 'Nis']) ?? '').trim();
      const nama = String(cellValue(['NAMA', 'nama', 'Nama']) ?? '').trim();
      const id = String(cellValue(['ID', 'id', 'Id']) ?? '').trim();
      const jenisKelamin = String(
        cellValue(['L/P', 'L / P', 'l p', 'jenis kelamin', 'JK', 'jk', 'Gender', 'gender']) ?? ''
      ).trim();

      if (!kelas && !nis && !nama) {
        return null;
      }

      if (!kelas || !nis || !nama) {
        throw new Error(`Baris ${index + 2} file Excel tidak lengkap. Pastikan kolom KELAS, NIS, dan NAMA terisi.`);
      }

      return {
        id,
        kelas,
        nis,
        nama,
        jenisKelamin,
      };
    })
    .filter(Boolean);
};

export const downloadSiswaImportTemplate = async () => {
  const XLSX = await import('xlsx');
  const rows = [
    ['ID', 'KELAS', 'NIS', 'NAMA', 'L/P'],
    ['1', 'X-1', '1001', 'Ayu Putri', 'P'],
    ['2', 'X-2', '1002', 'Budi Santoso', 'L'],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  if (!excelBuffer || typeof excelBuffer === 'string') {
    throw new Error('Template Excel gagal dibuat.');
  }

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  if (typeof window === 'undefined' || !window.URL || !window.URL.createObjectURL) {
    throw new Error('Browser tidak mendukung download file Excel.');
  }

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'template-siswa.xlsx';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);

  return {
    success: true,
    message: 'Template Excel siswa sedang dipersiapkan untuk diunduh.',
  };
};

export const importSiswaFromExcelFile = async (file) => {
  const rows = await readWorkbookRowsFromFile(file);
  const validRows = validateStudentImportRows(rows);
  return importSiswaData(validRows);
};
