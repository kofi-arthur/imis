import { useLocation, useNavigate } from "react-router";
import { createContext, useContext, useEffect, useState } from "react";

import { errorToast } from "../components/toast";
import { checkSession, loginUser, logoutUser } from "../services/api";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

    const from = location?.pathname || "/dashboard";
//   const from = location?.pathname + (location?.search || "") || "/dashboard";

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await checkSession();

      if (res.error) {
        errorToast(res.error);
        setUser(null);
      } else {
        setUser(res.data);
        // navigate(from, { replace: true });
        if (!location.pathname.includes("/reset-password")) {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  async function login(email, password) {
    try {
      const res = await loginUser(email, password);

      if (res.error) {
        return { error: res.error };
      }
      setUser(res.data);
      return { success: true, user: res.data };
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  }

  async function logout() {
    try {
     await logoutUser();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
