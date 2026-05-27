import { Router, type IRouter } from "express";
import { eq, sql, desc, gte, and } from "drizzle-orm";
import { db, interactionsTable } from "@workspace/db";
import {
  CreateInteractionBody,
  UpdateInteractionBody,
  GetInteractionParams,
  UpdateInteractionParams,
  DeleteInteractionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/interactions", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(interactionsTable)
    .orderBy(desc(interactionsTable.createdAt));
  const result = rows.map((r) => ({
    ...r,
    energyDelta: r.energyAfter - r.energyBefore,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json(result);
});

router.post("/interactions", async (req, res): Promise<void> => {
  const parsed = CreateInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(interactionsTable)
    .values({
      personName: parsed.data.personName,
      interactionType: parsed.data.interactionType,
      energyBefore: parsed.data.energyBefore,
      energyAfter: parsed.data.energyAfter,
      durationMinutes: parsed.data.durationMinutes,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json({
    ...row,
    energyDelta: row.energyAfter - row.energyBefore,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/interactions/summary", async (req, res): Promise<void> => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [todayRows, weekRows] = await Promise.all([
    db
      .select()
      .from(interactionsTable)
      .where(gte(interactionsTable.createdAt, startOfToday)),
    db
      .select()
      .from(interactionsTable)
      .where(gte(interactionsTable.createdAt, sevenDaysAgo)),
  ]);

  const todayScore =
    todayRows.length > 0
      ? Math.round(
          todayRows.reduce((sum, r) => sum + r.energyAfter, 0) / todayRows.length
        )
      : null;

  const weeklyDeltas = weekRows.map((r) => r.energyAfter - r.energyBefore);
  const weeklyAvgDelta =
    weeklyDeltas.length > 0
      ? weeklyDeltas.reduce((a, b) => a + b, 0) / weeklyDeltas.length
      : null;

  const totalThisWeek = weekRows.length;

  // Burnout is driven primarily by energy quality (avgDelta), with count as a secondary signal
  let burnoutLevel: "low" | "moderate" | "high" | "critical" = "low";
  if (weeklyAvgDelta !== null) {
    if (weeklyAvgDelta < -2.5 || (weeklyAvgDelta < -1 && totalThisWeek >= 14)) {
      burnoutLevel = "critical";
    } else if (weeklyAvgDelta < -1 || (weeklyAvgDelta < 0 && totalThisWeek >= 12)) {
      burnoutLevel = "high";
    } else if (weeklyAvgDelta < 0.5 && totalThisWeek >= 8) {
      burnoutLevel = "moderate";
    } else if (weeklyAvgDelta < 0) {
      burnoutLevel = "moderate";
    }
  } else if (totalThisWeek >= 12) {
    burnoutLevel = "moderate";
  }

  const typeDeltas: Record<string, number[]> = {};
  for (const r of weekRows) {
    if (!typeDeltas[r.interactionType]) typeDeltas[r.interactionType] = [];
    typeDeltas[r.interactionType].push(r.energyAfter - r.energyBefore);
  }

  let mostDrainingType: string | null = null;
  let mostEnergizingType: string | null = null;
  let minAvg = Infinity;
  let maxAvg = -Infinity;

  for (const [type, deltas] of Object.entries(typeDeltas)) {
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    if (avg < minAvg) { minAvg = avg; mostDrainingType = type; }
    if (avg > maxAvg) { maxAvg = avg; mostEnergizingType = type; }
  }

  res.json({
    todayEnergyScore: todayScore,
    weeklyAvgDelta,
    burnoutLevel,
    totalInteractionsThisWeek: totalThisWeek,
    mostDrainingType,
    mostEnergizingType,
  });
});

router.get("/interactions/people", async (req, res): Promise<void> => {
  const rows = await db.select().from(interactionsTable);

  const personMap: Record<
    string,
    { deltas: number[]; count: number; lastAt: Date | null }
  > = {};

  for (const r of rows) {
    if (!personMap[r.personName]) {
      personMap[r.personName] = { deltas: [], count: 0, lastAt: null };
    }
    personMap[r.personName].deltas.push(r.energyAfter - r.energyBefore);
    personMap[r.personName].count++;
    if (!personMap[r.personName].lastAt || r.createdAt > personMap[r.personName].lastAt!) {
      personMap[r.personName].lastAt = r.createdAt;
    }
  }

  const result = Object.entries(personMap).map(([personName, data]) => ({
    personName,
    avgEnergyDelta:
      data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length,
    totalInteractions: data.count,
    lastInteractionAt: data.lastAt ? data.lastAt.toISOString() : null,
  }));

  result.sort((a, b) => b.avgEnergyDelta - a.avgEnergyDelta);
  res.json(result);
});

router.get("/interactions/trends", async (req, res): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const rows = await db
    .select()
    .from(interactionsTable)
    .where(gte(interactionsTable.createdAt, sevenDaysAgo));

  const dayMap: Record<string, { net: number; count: number }> = {};

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { net: 0, count: 0 };
  }

  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].net += r.energyAfter - r.energyBefore;
      dayMap[key].count++;
    }
  }

  const result = Object.entries(dayMap).map(([date, data]) => ({
    date,
    netEnergyDelta: data.net,
    interactionCount: data.count,
  }));

  res.json(result);
});

router.get("/interactions/:id", async (req, res): Promise<void> => {
  const params = GetInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(interactionsTable)
    .where(eq(interactionsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  res.json({
    ...row,
    energyDelta: row.energyAfter - row.energyBefore,
    createdAt: row.createdAt.toISOString(),
  });
});

router.patch("/interactions/:id", async (req, res): Promise<void> => {
  const params = UpdateInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInteractionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(interactionsTable)
    .set(parsed.data)
    .where(eq(interactionsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  res.json({
    ...row,
    energyDelta: row.energyAfter - row.energyBefore,
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/interactions/:id", async (req, res): Promise<void> => {
  const params = DeleteInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(interactionsTable)
    .where(eq(interactionsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Interaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
