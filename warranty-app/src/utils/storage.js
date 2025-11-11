import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async setTokens(accessToken, refreshToken) {
    await AsyncStorage.multiSet([
      ['@access_token', accessToken],
      ['@refresh_token', refreshToken]
    ]);
  },

  async getAccessToken() {
    return await AsyncStorage.getItem('@access_token');
  },

  async getRefreshToken() {
    return await AsyncStorage.getItem('@refresh_token');
  },

  async clearTokens() {
    await AsyncStorage.multiRemove(['@access_token', '@refresh_token']);
  },

  async setUser(user) {
    await AsyncStorage.setItem('@user', JSON.stringify(user));
  },

  async getUser() {
    const user = await AsyncStorage.getItem('@user');
    return user ? JSON.parse(user) : null;
  },

  async clearUser() {
    await AsyncStorage.removeItem('@user');
  }
};

