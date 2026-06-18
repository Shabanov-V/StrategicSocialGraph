import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "./auth.js";
import pool from "./db.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await pool.query(
    "SELECT yaml_text, updated_at FROM graphs WHERE user_id = $1",
    [req.user!.userId]
  );
  if (result.rows.length === 0) {
    res.json({ graph: null });
    return;
  }
  res.json({ graph: result.rows[0].yaml_text, updatedAt: result.rows[0].updated_at });
});

router.put("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { yaml } = req.body;
  if (typeof yaml !== "string") {
    res.status(400).json({ error: "Missing yaml field" });
    return;
  }

  const result = await pool.query(
    `INSERT INTO graphs (user_id, yaml_text, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET yaml_text = $2, updated_at = NOW()
     RETURNING updated_at`,
    [req.user!.userId, yaml]
  );

  res.json({ ok: true, updatedAt: result.rows[0].updated_at });
});

export default router;
