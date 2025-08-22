import styles from "../../styles/app/auth/auth.module.css";

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { LoadingComponent } from "../../components/loading";
import { forgotPassword } from "../../services/api";
import { errorToast } from "../../components/toast";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [mail, setMail] = useState("");

  async function handleSendEmail() {
    setIsLoading(true);

    try {
      const response = await forgotPassword(mail);
      if (response.success) {
        navigate("/email-sent");
      } else {
        errorToast(response.error);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      errorToast(
        "An error occured while sending email. Please try again later"
      );
    } finally {
      return setIsLoading(false);
    }
  }

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Forgot Password</h2>
      <p className={styles.instruction}>
        Enter your email address below and we'll send you instructions to reset
        your password.
      </p>
      <div className={styles.field}>
        <input
          className={styles.input}
          type="email"
          value={mail}
          onChange={(e) => setMail(e.target.value)}
          placeholder="Email address"
        />
      </div>
      <button
        className={styles.button}
        disabled={mail === ""}
        onClick={() => handleSendEmail()}
      >
        {isLoading ? <LoadingComponent width={25} height={25} /> : "Send Email"}
      </button>
      <span className={styles.link} onClick={() => navigate("/login")}>
        Go Back
      </span>
    </div>
  );
}
