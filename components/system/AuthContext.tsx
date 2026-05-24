





import { createContext, useContext, useEffect, useState } from "react";
import { getSession, saveSession, clearSession } from "@/lib/auth";

type Role = "guest" | "customer" | "admin" | "cashier" | "owner";

// 🚀 Perbarui tipe agar menampung objek data user terintegrasi
type UserSession = {
  id: number;
  email: string;
  role: Role;
  name?: string;
  token?: string;
};

type AuthContextType = {
  role: Role;
  user: UserSession | null; // 👈 Tambahkan ini agar komponen lain tahu siapa yang login
  loading: boolean;
  login: (role: Role, email: string, userId: number, name?: string, token?: string) => Promise<void>; // 👈 Tambahkan userId + token
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("guest");
  const [user, setUser] = useState<UserSession | null>(null); // 👈 State user baru
  const [loading, setLoading] = useState(true);

  // INIT (load dari AsyncStorage)
  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (session?.role) {
        setRole(session.role as Role);
        setUser(session as UserSession); // 👈 Kembalikan data user lengkap beserta ID-nya setelah refresh
      }
      setLoading(false);
    };
    init();
  }, []);

  // LOGIN (Menggunakan data asli kiriman Laravel)
  const login = async (selectedRole: Role, email: string, userId: number, name?: string, token?: string) => {
    setLoading(true);

    const userData: UserSession = {
      id: userId, // 👈 ID asli dari MySQL
      email: email,
      role: selectedRole,
      name: name || "Pengguna Ricebowland",
      token: token,
    };

    await saveSession(userData);
    setUser(userData);
    setRole(selectedRole);
    setLoading(false);
  };

  // LOGOUT
  const logout = async () => {
    await clearSession();
    setUser(null);
    setRole("guest");
  };

  return (
    <AuthContext.Provider value={{ role, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}