import { Router, type IRouter } from "express";
import { desc, gte } from "drizzle-orm";
import { db, interactionsTable, insightsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/insights", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(insightsTable)
    .orderBy(desc(insightsTable.createdAt))
    .limit(20);

  res.json(
    rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
  );
});

router.post("/insights/generate", async (req, res): Promise<void> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const interactions = await db
    .select()
    .from(interactionsTable)
    .where(gte(interactionsTable.createdAt, sevenDaysAgo))
    .orderBy(desc(interactionsTable.createdAt))
    .limit(30);

  if (interactions.length < 2) {
    res.status(400).json({ error: "Not enough interaction data to generate insights. Log at least 2 interactions first." });
    return;
  }

  const interactionSummary = interactions.map((i) => ({
    person: i.personName,
    type: i.interactionType,
    energyBefore: i.energyBefore,
    energyAfter: i.energyAfter,
    delta: i.energyAfter - i.energyBefore,
    duration: i.durationMinutes,
    notes: i.notes,
    date: i.createdAt.toISOString().slice(0, 10),
  }));

  const prompt = `You are an empathetic social intelligence coach analyzing someone's social energy patterns.

Here are their recent social interactions (last 7 days):
${JSON.stringify(interactionSummary, null, 2)}

Generate 3-4 insightful observations about their social energy patterns. Each insight should be:
- Specific to their actual data, not generic
- Actionable and constructive
- Written in second person ("You tend to...", "Your energy...", "Consider...")
- 1-2 sentences long

Return a JSON array with this structure:
[
  { "content": "insight text here", "category": "pattern" | "burnout_warning" | "recovery_suggestion" | "social_tip" }
]

Categories:
- "pattern": A recurring pattern in their social energy
- "burnout_warning": Signs of social exhaustion or overextension
- "recovery_suggestion": Specific recovery action based on their patterns
- "social_tip": A social intelligence tip tailored to their data

Return only the JSON array, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "[]";

  let parsed: Array<{ content: string; category: string }>;
  try {
    parsed = JSON.parse(content);
  } catch {
    res.status(400).json({ error: "Failed to parse AI response" });
    return;
  }

  const validCategories = ["pattern", "burnout_warning", "recovery_suggestion", "social_tip"];
  const toInsert = parsed
    .filter((item) => item.content && validCategories.includes(item.category))
    .map((item) => ({ content: item.content, category: item.category }));

  if (toInsert.length === 0) {
    res.status(400).json({ error: "No valid insights generated" });
    return;
  }

  const inserted = await db.insert(insightsTable).values(toInsert).returning();

  res.json(
    inserted.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))
  );
});

export default router;
