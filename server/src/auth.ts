import { Router, Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === "production"
    ? (() => { throw new Error("JWT_SECRET must be set in production"); })()
    : "dev-only-secret"
);
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "token";

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

export interface AuthPayload {
  userId: number;
  googleId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

router.post("/google", async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;
  if (!credential) {
    res.status(400).json({ error: "Missing credential" });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ error: "Invalid token payload" });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    const result = await pool.query(
      `INSERT INTO users (google_id, email, name, picture)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_id) DO UPDATE SET email = $2, name = $3, picture = $4
       RETURNING id, google_id, email, name, picture`,
      [googleId, email, name || "", picture || null]
    );

    const user = result.rows[0];

    const jwtPayload: AuthPayload = {
      userId: user.id,
      googleId: user.google_id,
      email: user.email,
    };

    const token = jwt.sign(jwtPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Authentication failed" });
  }
});

router.get("/me", async (req: AuthRequest, res: Response): Promise<void> => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.json({ user: null });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const result = await pool.query(
      "SELECT id, email, name, picture FROM users WHERE id = $1",
      [payload.userId]
    );
    if (result.rows.length === 0) {
      res.json({ user: null });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch {
    res.json({ user: null });
  }
});

router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

export default router;
