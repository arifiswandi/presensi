export const fetchAnekdots = async (postToGas) => {
  const data = await postToGas({ action: 'read' }, 'Memuat data');

  if (!data.success) {
    throw new Error(data.message || 'Gagal memuat data.');
  }

  return data.data || [];
};

export const createAnekdot = async (postToGas, payload) => {
  const data = await postToGas({ action: 'create', payload }, 'Simpan data');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal menyimpan data');
  }

  return data;
};

export const updateAnekdot = async (postToGas, payload) => {
  const data = await postToGas({ action: 'update', payload }, 'Update data');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal memperbarui data');
  }

  return data;
};

export const deleteAnekdot = async (postToGas, id) => {
  const data = await postToGas({ action: 'delete', id }, 'Hapus data');

  if (data.success === false) {
    throw new Error(data.message || 'Gagal menghapus data.');
  }

  return data;
};

export const importAnekdotsFromExcel = async (postToGas, file, mapRowToRecord) => {
  const { readWorkbookRowsFromFile } = await import('../features/anekdots/utils/importExcel');
  const rows = await readWorkbookRowsFromFile(file);
  const normalizedRows = rows
    .map(mapRowToRecord)
    .filter(
      (row) =>
        row.NamaSiswa ||
        row.Kelas ||
        row.Kejadian ||
        row.Penanganan ||
        row.Keterangan ||
        row.Tanggal,
    );

  if (!normalizedRows.length) {
    throw new Error('File Excel tidak berisi data yang valid untuk diimpor.');
  }

  for (const item of normalizedRows) {
    await postToGas({ action: 'create', payload: item }, 'Impor data Excel');
  }

  return normalizedRows.length;
};
