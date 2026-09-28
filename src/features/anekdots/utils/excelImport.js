export const normalizeFieldKey = (key) =>
  String(key ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const normalizeDateString = (value) => {
  if (!value) return '';

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + value * 86400000);
    return parsed.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) return '';

    const directDate = new Date(trimmedValue);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate.toISOString().slice(0, 10);
    }

    const match = trimmedValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (match) {
      const [, day, month, year] = match;
      const normalizedYear = year.length === 2 ? `20${year}` : year;
      const parsedDate = new Date(`${normalizedYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString().slice(0, 10);
      }
    }

    return trimmedValue;
  }

  return String(value).trim();
};

export const mapExcelRowToRecord = (row) => {
  const mappedValues = {};

  Object.entries(row || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeFieldKey(key);
    const cleanedValue = value == null ? '' : String(value).trim();

    if (!normalizedKey || !cleanedValue) return;

    if (normalizedKey.includes('tanggal')) {
      mappedValues.Tanggal = normalizeDateString(value);
    } else if (normalizedKey.includes('namasiswa') || normalizedKey.includes('siswa')) {
      mappedValues.NamaSiswa = cleanedValue;
    } else if (normalizedKey.includes('kelas')) {
      mappedValues.Kelas = cleanedValue;
    } else if (normalizedKey.includes('kejadian') || normalizedKey.includes('perilaku')) {
      mappedValues.Kejadian = cleanedValue;
    } else if (normalizedKey.includes('penanganan') || normalizedKey.includes('tindaklanjut')) {
      mappedValues.Penanganan = cleanedValue;
    } else if (normalizedKey.includes('keterangan')) {
      mappedValues.Keterangan = cleanedValue;
    }
  });

  return {
    ID: '',
    Tanggal: mappedValues.Tanggal || '',
    NamaSiswa: mappedValues.NamaSiswa || '',
    Kelas: mappedValues.Kelas || '',
    Kejadian: mappedValues.Kejadian || '',
    Penanganan: mappedValues.Penanganan || '',
    Keterangan: mappedValues.Keterangan || '',
  };
};

export const normalizeImportedRecord = mapExcelRowToRecord;
