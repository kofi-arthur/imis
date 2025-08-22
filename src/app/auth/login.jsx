import styles from "../../styles/app/auth/auth.module.css";

import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { LoadingComponent } from "../../components/loading";
import { errorToast } from "../../components/toast";
import { useAuth } from "../../contexts/authContext";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(false);
  const [togglePassword, setTogglePassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });

  async function handleLogin() {
    setIsLoading(true);

    try {
      const result = await login(credentials.email, credentials.password);

      if (result.error) {
        return errorToast(result.error);
      }

      const user = result.user;

      if (user.role === "admin") {
        const from = location.state?.from?.pathname || "/admin";
        navigate(from === "/login" ? "/admin" : from, { replace: true });
      } else {
        const from = location.state?.from?.pathname || "/All-Projects";
        navigate(from === "/login" ? "/All-Projects" : from, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      errorToast("Error logging in. Please try again later");
    } finally {
      return setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Sign In</h2>
      <div className={styles.field}>
        <input
          autoFocus
          className={styles.input}
          type="email"
          value={credentials?.email}
          onChange={(e) =>
            setCredentials({ ...credentials, email: e.target.value })
          }
          placeholder="Email address"
        />
      </div>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={credentials?.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          type={togglePassword ? "text" : "password"}
          placeholder="Password"
        />
        <i
          onClick={() => setTogglePassword(!togglePassword)}
          className={togglePassword ? "fal fa-eye-slash" : "fal fa-eye"}
        ></i>
      </div>
      <button
        className={styles.button}
        disabled={credentials.email === "" || credentials.password === ""}
        onClick={() => {
          isLoading ? null : handleLogin();
        }}
      >
        {isLoading ? <LoadingComponent width={25} height={25} /> : "Sign In"}
      </button>

      <span
        className={styles.link}
        onClick={() => navigate("/forgot-password")}
      >
        Forgot your password?
      </span>

      <p className={styles.question}>
        Don't have a Wayoe Work Suite account yet?
      </p>

      <button
        className={styles.signupbutton}
        onClick={() => navigate("/signup")}
      >
        Sign Up
      </button>
    </div>
  );
}
