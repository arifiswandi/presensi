import { postToGas } from './gasPresensiService';

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

  return {
    id: item?.id ?? item?.nis ?? item?.NIS ?? `${item?.kelas ?? 'siswa'}-${index}`,
    nis: item?.nis ?? item?.NIS ?? String(index + 1),
    name: item?.nama ?? item?.name ?? item?.NamaSiswa ?? item?.Nama ?? 'Siswa',
    kelas: item?.kelas ?? item?.Kelas ?? item?.kelasSiswa ?? item?.KelasSiswa ?? '',
    jenisKelamin,
    gender: jenisKelamin,
    status: item?.status ?? '',
  };
};

export const fetchPresensiStudents = async () => {
  const data = await postToGas({ action: 'getSiswa' }, 'Memuat daftar siswa');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal memuat daftar siswa.');
  }

  const rows = normalizeRows(data);

  return rows.map((item, index) => normalizeStudent(item, index));
};

export const fetchPresensiStatusByDate = async ({ tanggal, kelas }) => {
  try {
    const data = await postToGas({ action: 'getPresensiByDate', tanggal, kelas }, 'Memuat status presensi');

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

export const fetchMonthlySummary = async ({ kelas, bulan, tahun }) => {
  try {
    const data = await postToGas({ action: 'getRekap', kelas, bulan, tahun }, 'Memuat rekap bulanan');

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
    kelas: payload.kelas,
    presensiData: Array.isArray(payload.presensiData) ? payload.presensiData : [],
  };

  const data = await postToGas(normalizedPayload, 'Simpan data presensi');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal menyimpan data presensi.');
  }

  return data;
};
