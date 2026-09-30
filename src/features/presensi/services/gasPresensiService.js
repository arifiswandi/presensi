const GAS_DEPLOYMENT_URL = 'https://script.google.com/macros/s/AKfycbx8uUhZCShJqr3uiOXeRcZTzZ59wQtzmC5O-4Npn13aKcyEwn2fwfLDxQWmyf6qZg/exec';

export const GAS_URL = import.meta.env.DEV ? '/api/gas' : GAS_DEPLOYMENT_URL;

export const postToGas = async (payload, actionLabel = 'permintaan') => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = {};

  console.log('[GAS]', actionLabel, {
    status: response.status,
    payload,
    rawResponse: text,
  });

  if (text) {
    try {
      data = JSON.parse(text);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      throw new Error(
        `${actionLabel} gagal: server mengembalikan format bukan JSON. Status: ${response.status}. Detail: ${text.slice(0, 200)}`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      `${actionLabel} gagal. Status: ${response.status}. ${data.message || text || 'Server tidak merespons.'}`,
    );
  }

  return data;
};
