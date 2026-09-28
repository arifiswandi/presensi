export async function readWorkbookRowsFromFile(file) {
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
}

export const readWorkbookFromFile = readWorkbookRowsFromFile;
