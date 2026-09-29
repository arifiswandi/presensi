export const GAS_URL = 'https://script.google.com/macros/s/AKfycby1DGxyI7FB3q2XtOfUDy6eB8nNljmIBv7bFw6MTWpASA_OZxDP1LbUyfCNFK8LBfXmXw/exec';


export const postToGas = async (payload, actionLabel = 'permintaan') => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
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
