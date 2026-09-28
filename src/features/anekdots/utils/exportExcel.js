export async function exportWorkbookAsExcel(rows, fileName, sheetName = 'Sheet1') {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('Belum ada data yang bisa diekspor.');
  }

  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}
