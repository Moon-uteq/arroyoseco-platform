import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const router = Router();

// Array se borra al reiniciar
const users = []; // { id, name, email, passwordHash, createdAt }

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-demo";
const TOKEN_TTL = "2h";

// Helpers
const normalizeEmail = (e = "") => e.trim().toLowerCase();
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt });

/**
 * POST /api/register
 * Body: { name, email, password }
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email y password son obligatorios" });
    }

    const mail = normalizeEmail(email);
    const exists = users.find((u) => u.email === mail);
    if (exists) {
      return res.status(409).json({ success: false, message: "El email ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: mail,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);

    const token = jwt.sign({ sub: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });

    return res.status(201).json({
      success: true,
      data: { user: publicUser(newUser), token }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error en registro", detail: err?.message });
  }
});

/**
 * POST /api/login
 * Body: { email, password }
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email y password son obligatorios" });
    }

    const mail = normalizeEmail(email);
    const user = users.find((u) => u.email === mail);
    if (!user) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });

    return res.status(200).json({
      success: true,
      data: { user: publicUser(user), token }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Error en login", detail: err?.message });
  }
});

/**
 * (Opcional) GET /api/me   Authorization: Bearer <token>
 */
router.get("/me", (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Token requerido" });

    const payload = jwt.verify(token, JWT_SECRET);

    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ success: false, message: "Token inválido" });

    return res.json({ success: true, data: { user: publicUser(user) } });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token inválido", detail: err?.message });
  }
});

export default router;
