import React from 'react';

export default function AnekdotFormModal({
  isOpen,
  isEditing,
  formData,
  loading,
  onClose,
  onSubmit,
  onChange,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__card">
        <div className="modal__header">
          <h3>{isEditing ? 'Edit Catatan' : 'Tambah Catatan Baru'}</h3>
          <button type="button" className="modal__close" onClick={onClose}>×</button>
        </div>

        <div className="modal__body">
          <form className="modal__form" onSubmit={onSubmit}>
            <div className="modal__grid">
              <div className="modal__field">
                <label>Tanggal</label>
                <input className="modal__input" type="date" name="Tanggal" value={formData.Tanggal} onChange={onChange} required />
              </div>

              <div className="modal__field">
                <label>Kelas</label>
                <input className="modal__input" type="text" name="Kelas" value={formData.Kelas} onChange={onChange} required />
              </div>
            </div>

            <div className="modal__field modal__field--full">
              <label>Nama Siswa</label>
              <input className="modal__input" type="text" name="NamaSiswa" value={formData.NamaSiswa} onChange={onChange} required />
            </div>

            <div className="modal__field modal__field--full">
              <label>Kejadian / Perilaku</label>
              <textarea className="modal__textarea" name="Kejadian" value={formData.Kejadian} onChange={onChange} required rows="3" />
            </div>

            <div className="modal__field modal__field--full">
              <label>Tindak Lanjut / Penanganan</label>
              <textarea className="modal__textarea" name="Penanganan" value={formData.Penanganan} onChange={onChange} required rows="3" />
            </div>

            <div className="modal__field modal__field--full">
              <label>Keterangan</label>
              <input className="modal__input" type="text" name="Keterangan" value={formData.Keterangan} onChange={onChange} />
            </div>

            <div className="modal__actions">
              <button type="submit" disabled={loading} className="modal__save">
                {loading ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>

              <button type="button" className="modal__secondary" onClick={onCancel}>
                {isEditing ? 'Batal Edit' : 'Tutup'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
