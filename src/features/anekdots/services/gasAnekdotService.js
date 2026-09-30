export const GAS_URL = 'https://script.google.com/macros/s/AKfycby4No_Yd3lOZ90h4SnwFEohUD_99_q3khqsb8raPeUCQl7bX63R81FCjueejU--GP1O/exec';

export const postToGas = async (payload, actionLabel = 'permintaan') => {
  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let data = {};

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
