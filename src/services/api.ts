export const apiClient = {
  async get<T>(_path: string): Promise<T | null> {
    return Promise.resolve(null);
  }
};
