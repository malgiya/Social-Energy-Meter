import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, interactionsTable } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/people/analysis", async (req, res): Promise<void> => {
  const interactions = await db
    .select()
    .from(interactionsTable)
    .orderBy(desc(interactionsTable.createdAt))
    .limit(100);

  if (interactions.length < 2) {
    res.status(400).json({ error: "Not enough interaction data. Log at least 2 interactions first." });
    return;
  }

  // Aggregate per-person stats
  const personMap: Record<string, { deltas: number[]; count: number; types: string[] }> = {};
  for (const r of interactions) {
    if (!personMap[r.personName]) {
      personMap[r.personName] = { deltas: [], count: 0, types: [] };
    }
    personMap[r.personName].deltas.push(r.energyAfter - r.energyBefore);
    personMap[r.personName].count++;
    personMap[r.personName].types.push(r.interactionType);
  }

  const peopleStats = Object.entries(personMap).map(([name, data]) => {
    const avg = data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length;
    const positiveRatio = data.deltas.filter((d) => d > 0).length / data.deltas.length;
    return {
      personName: name,
      avgEnergyDelta: avg,
      totalInteractions: data.count,
      positiveRatio,
      types: [...new Set(data.types)],
    };
  });

  const total = interactions.length;
  const energizingCount = interactions.filter((r) => r.energyAfter - r.energyBefore > 0).length;
  const drainingCount = interactions.filter((r) => r.energyAfter - r.energyBefore < 0).length;
  const neutralCount = total - energizingCount - drainingCount;

  const prompt = `You are an empathetic social intelligence coach analyzing someone's social circle.

Here are their per-person interaction stats:
${JSON.stringify(peopleStats, null, 2)}

Overall: ${energizingCount} energizing interactions, ${drainingCount} draining, ${neutralCount} neutral out of ${total} total.

Your task: Return a JSON object with this exact structure:

{
  "safePeople": [
    // Only include people with avg delta > 0.5 and at least 2 interactions
    // Max 5 entries, sorted by safetyScore desc
    {
      "personName": "string",
      "avgEnergyDelta": number,
      "totalInteractions": number,
      "safetyScore": number, // 0-100: how consistently energizing (100 = always positive)
      "summary": "string" // ONE sentence, specific and warm, e.g. "Conversations with Jordan almost always leave you brighter than before."
    }
  ],
  "connections": [
    // ALL people, classified and with a short insight
    {
      "personName": "string",
      "avgEnergyDelta": number,
      "totalInteractions": number,
      "classification": "energizing" | "neutral" | "draining",
      "insight": "string" // ONE short sentence about this person's pattern
    }
  ],
  "interactionBalance": {
    "energizingCount": ${energizingCount},
    "neutralCount": ${neutralCount},
    "drainingCount": ${drainingCount},
    "energizingPercent": ${Math.round((energizingCount / total) * 100)},
    "drainingPercent": ${Math.round((drainingCount / total) * 100)}
  },
  "overallHealthScore": number, // 0-100 based on balance of energizing vs draining
  "summary": "string" // 2-3 sentences about the overall social circle health
}

Rules:
- classification: avgDelta > 0.5 → "energizing", avgDelta < -0.5 → "draining", else "neutral"
- safetyScore: (positiveRatio * 70) + (Math.min(avgDelta, 5) / 5 * 30), scaled 0-100
- overallHealthScore: based on energizing%, consistency, and quality of safe relationships
- Be specific and personal, not generic
- Return ONLY the JSON object, no other text`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    res.status(400).json({ error: "Failed to parse AI response" });
    return;
  }

  res.json(parsed);
});

export default router;
