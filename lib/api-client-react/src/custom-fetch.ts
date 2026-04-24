let authTokenGetter: (() => string | null | Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: typeof authTokenGetter) => {
  authTokenGetter = getter;
};

export const customFetch = async <T>(
  url: string,
  options: RequestInit,
): Promise<T> => {
  const finalOptions = { ...options };
  
  if (authTokenGetter) {
    const token = await authTokenGetter();
    if (token) {
      finalOptions.headers = {
        ...finalOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, finalOptions);
  
  if (response.status === 204) {
    return {} as T;
  }

  if (!response.ok) {
    let error;
    try {
      error = await response.json();
    } catch (e) {
      error = { message: response.statusText };
    }
    throw error;
  }

  return response.json() as T;
};
