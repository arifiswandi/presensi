const DEFAULT_GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/s/AKfycbx8uUhZCShJqr3uiOXeRcZTzZ59wQtzmC5O-4Npn13aKcyEwn2fwfLDxQWmyf6qZg/exec';

export const GAS_URL = (import.meta.env.VITE_GAS_URL && String(import.meta.env.VITE_GAS_URL).trim())
  || (import.meta.env.DEV ? '/api/gas' : DEFAULT_GAS_DEPLOYMENT_URL);

export const postToGas = async (payload, actionLabel = 'permintaan') => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    // headers: {
    //   'Content-Type': 'application/json',
    // },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = {};

  console.log('[GAS]', actionLabel, {
    status: response.status,
    payload,
    rawResponse: text,
  });

  if (text && typeof text === 'string') {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        data = JSON.parse(trimmed);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        if (response.ok) {
          throw new Error(
            `${actionLabel} gagal: server mengembalikan format bukan JSON. Status: ${response.status}. Detail: ${trimmed.slice(0, 200)}`,
          );
        }
      }
    }
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `${actionLabel} gagal: endpoint Google Apps Script tidak valid atau deployment belum aktif. Periksa URL GAS dan lakukan deploy web app yang baru.`,
      );
    }

    const serverMessage = data && typeof data === 'object' && data.message ? data.message : text;
    throw new Error(
      `${actionLabel} gagal. Status: ${response.status}. ${serverMessage || 'Server tidak merespons.'}`,
    );
  }

  if (text && !data) {
    throw new Error(
      `${actionLabel} gagal: server mengembalikan format bukan JSON. Status: ${response.status}. Detail: ${text.slice(0, 200)}`,
    );
  }

  return data;
};
