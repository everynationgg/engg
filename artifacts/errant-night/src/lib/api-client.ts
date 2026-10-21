let authTokenGetter: (() => string | null | Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: typeof authTokenGetter) => {
  authTokenGetter = getter;
};

export const getAuthToken = async () => {
  if (authTokenGetter) {
    return await authTokenGetter();
  }
  return null;
};
