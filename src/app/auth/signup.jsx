import styles from "../../styles/app/auth/auth.module.css";

import { useState } from "react";
import { useNavigate } from "react-router";

import { LoadingComponent } from "../../components/loading";
import { errorToast, successToast, warnToast } from "../../components/toast";
import { signup } from "../../services/api";

export default function Signup() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [togglePassword, setTogglePassword] = useState(false);
  const [credentials, setCredentials] = useState({
    mail: "",
    password: "",
    confirmPassword: "",
  });

  const [isFocused, setIsFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  async function handleSignup() {
    const emailSplit = credentials.mail.split("@");
    const domain = emailSplit[1];

    if (domain !== "wayoeltd.com") {
      return warnToast("Unrecognized email");
    }

    if (credentials.password !== credentials.confirmPassword) {
      return warnToast("Passwords do not match");
    }

    setIsLoading(true);

    try {
      const result = await signup(credentials.mail, credentials.password);

      if (result.error) {
        return errorToast(result.error);
      } else {
        successToast("Account created successfully");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      errorToast("Error signing up. Please try again later");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Sign Up</h2>
      <div className={styles.field}>
        <input
          className={styles.input}
          type="email"
          value={credentials?.mail}
          onChange={(e) =>
            setCredentials({ ...credentials, mail: e.target.value })
          }
          placeholder="Wayoe email address"
        />
      </div>
      <div className={styles.field}>
        <input
          className={styles.input}
          onFocus={() => setIsFocused(true)}
          value={credentials?.password}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
          type={togglePassword ? "text" : "password"}
          placeholder="Password"
        />
      </div>
      <div className={styles.field}>
        <input
          className={styles.input}
          onBlur={() => setIsFocused(false)}
          value={credentials?.confirmPassword}
          onChange={(e) =>
            setCredentials({ ...credentials, confirmPassword: e.target.value })
          }
          type={togglePassword ? "text" : "password"}
          placeholder="Confirm password"
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

      {isFocused && credentials.password && (
        <div className={styles.passwordChecker}>
          <p
            className={
              credentials.password.length < 6 ? styles.error : styles.success
            }
          >
            Password must be at least 6 characters long
          </p>
          <p
            className={
              !/[A-Z]/.test(credentials.password)
                ? styles.error
                : styles.success
            }
          >
            Password must contain an uppercase letter
          </p>
          <p
            className={
              !/[0-9]/.test(credentials.password)
                ? styles.error
                : styles.success
            }
          >
            Password must contain a number
          </p>
        </div>
      )}
      {isConfirmFocused && credentials.password && (
        <div className={styles.passwordChecker}>
          <p
            className={
              credentials.confirmPassword !== credentials.password
                ? styles.error
                : styles.success
            }
          >
            Password must match
          </p>
        </div>
      )}

      <button
        className={styles.button}
        disabled={
          credentials.password.length < 6 ||
          !/[A-Z]/.test(credentials.password) ||
          !/[0-9]/.test(credentials.password) ||
          credentials.confirmPassword !== credentials.password ||
          credentials.email === "" ||
          credentials.password === "" ||
          credentials.confirmPassword === ""
        }
        onClick={() => {
          isLoading ? null : handleSignup();
        }}
      >
        {isLoading ? <LoadingComponent width={25} height={25} /> : "Sign Up"}
      </button>

      <p className={styles.question}>
        Already have a Wayoe Work Suite account?
      </p>

      <button
        className={styles.signupbutton}
        onClick={() => navigate("/login")}
      >
        Sign In
      </button>
    </div>
  );
}
