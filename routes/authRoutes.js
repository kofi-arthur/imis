import express from "express";
import { checkSession, forgotPassword, login, logout, resetPassword, signup, test } from "../controllers/authController.js";

const app = express.Router();

app.get("/test",test);
app.get('/session', checkSession);
app.post("/signup", signup);
app.post("/login", login);
app.post('/forgot-password', forgotPassword)
app.post('/reset-password', resetPassword)
app.post("/logout", logout);

export default app;

