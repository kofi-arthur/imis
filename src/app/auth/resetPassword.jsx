import styles from "../../styles/app/auth/auth.module.css";

import { useState } from "react";

import { useNavigate } from "react-router";
import { LoadingComponent } from "../../components/loading";
import { errorToast } from "../../components/toast";
import { resetPassword } from "../../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    password: "",
    confirmPassword: "",
  });
  const [togglePassword, setTogglePassword] = useState(false);
  async function handleResetPassword() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    setIsLoading(true);
    try {
      const res = await resetPassword(token, passwords.password);
      if (res.success) {
        navigate("/login");
      } else {
        errorToast(res.error);
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      errorToast(
        "An error occured while resetting password. Please try again later"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Reset Password</h2>
      <p className={styles.instruction}>Create a new password.</p>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={passwords?.password}
          onChange={(e) =>
            setPasswords({ ...passwords, password: e.target.value })
          }
          type={togglePassword ? "text" : "password"}
          placeholder="New password"
        />
      </div>
      <div className={styles.field}>
        <input
          className={styles.input}
          value={passwords?.confirmPassword}
          onChange={(e) =>
            setPasswords({ ...passwords, confirmPassword: e.target.value })
          }
          type={togglePassword ? "text" : "password"}
          placeholder="Confirm new password"
        />
      </div>

      <button
        className={styles.togglePassword}
        onClick={() => setTogglePassword(!togglePassword)}
      >
        <i
          className={togglePassword ? "fas fa-check-square" : "fal fa-square"}
          style={{ color: togglePassword && "var(--primary)" }}
        ></i>
        <p>Show Password</p>
      </button>

      <button
        className={styles.button}
        disabled={
          passwords?.password === "" ||
          passwords?.confirmPassword === "" ||
          passwords?.password !== passwords?.confirmPassword
        }
        onClick={() => handleResetPassword()}
      >
        {isLoading ? (
          <LoadingComponent width={25} height={25} />
        ) : (
          "Reset Password"
        )}
      </button>

      <span className={styles.link} onClick={() => navigate("/login")}>
        Cancel
      </span>
    </div>
  );
}
