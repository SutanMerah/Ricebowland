import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "AUTH_SESSION";

export type UserSession = {
  id?: number;
  email: string;
  role: string;
  name?: string;
  token?: string;
};

export async function saveSession(session: UserSession) {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export async function getSession(): Promise<UserSession | null> {
  const data = await AsyncStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
}

export async function clearSession() {
  await AsyncStorage.removeItem(AUTH_KEY);
}