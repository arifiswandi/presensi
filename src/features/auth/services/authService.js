export const loginUser = async (credentials, postToGas) => {
  const { username, password } = credentials;
  const data = await postToGas({ action: 'login', username, password }, 'Login');

  if (!data.success) {
    throw new Error(data.message || 'Login gagal.');
  }

  return {
    username: data.username,
    role: data.role,
  };
};
