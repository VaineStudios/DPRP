import Anthropic from '@anthropic-ai/sdk';
import type { DisasterEvent, Shelter, ShelterUpdate } from '@prisma/client';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';
const TIMEOUT_MS = 30_000;

export interface AiRecommendationItem {
  target_shelter_id: string | null;
  type: 'redirect' | 'resupply' | 'dispatch_team' | 'consolidate' | 'evacuate';
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  reasoning: string;
}

export interface AiPredictionResult {
  predictions: Array<{
    shelterName: string;
    estimatedCapacityReachTime: string;
    confidence: string;
  }>;
  prePositioning: Array<{
    shelterId: string;
    resource: string;
    quantity: string;
    rationale: string;
  }>;
  timeline: Record<string, unknown>;
}

type ShelterWithUpdate = Shelter & {
  latestUpdate?: ShelterUpdate | null;
};

/** Strip markdown code fences (```json ... ```) that Claude sometimes adds despite instructions */
const stripCodeFences = (text: string): string => {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  return match ? match[1].trim() : trimmed;
};

const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000;

const formatTimeSince = (date: Date | string): string => {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatShelterData = (shelters: ShelterWithUpdate[]): string => {
  // Compute network-level summary
  const withUpdates = shelters.filter(s => s.latestUpdate);
  const online = withUpdates.filter(s => {
    const age = Date.now() - new Date(s.latestUpdate!.createdAt).getTime();
    return age <= OFFLINE_THRESHOLD_MS;
  });
  const critical = withUpdates.filter(s => s.latestUpdate!.capacityLevel >= 4);
  const resourceWarnings = withUpdates.filter(s => {
    const u = s.latestUpdate!;
    return u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2;
  });
  const avgCap = withUpdates.length > 0
    ? Math.round((withUpdates.reduce((sum, s) => sum + s.latestUpdate!.capacityLevel, 0) / withUpdates.length / 5) * 100)
    : 0;

  const lines: string[] = [];
  lines.push(`## Network Summary`);
  lines.push(`- Total shelters in system: ${shelters.length}`);
  lines.push(`- Shelters with reports: ${withUpdates.length} (${online.length} online, ${withUpdates.length - online.length} offline >30min)`);
  lines.push(`- Critical capacity (4-5/5): ${critical.length} shelters`);
  lines.push(`- Resource warnings (any resource ≤2/5): ${resourceWarnings.length} shelters`);
  lines.push(`- Average capacity utilization: ${avgCap}%`);
  lines.push(`- Shelters with no reports yet: ${shelters.length - withUpdates.length}`);

  // Group shelters by parish
  const byParish = new Map<string, ShelterWithUpdate[]>();
  for (const s of shelters) {
    const list = byParish.get(s.parish) || [];
    list.push(s);
    byParish.set(s.parish, list);
  }

  for (const [parish, parishShelters] of byParish) {
    const parishReporting = parishShelters.filter(s => s.latestUpdate);
    lines.push(`\n## ${parish} (${parishShelters.length} shelters, ${parishReporting.length} reporting)`);
    for (const s of parishShelters) {
      const u = s.latestUpdate;
      const capInfo = s.maxCapacity ? `, Max capacity: ${s.maxCapacity} people` : '';
      const typeInfo = s.facilityType ? ` [${s.facilityType}]` : '';
      if (u) {
        const age = Date.now() - new Date(u.createdAt).getTime();
        const offlineTag = age > OFFLINE_THRESHOLD_MS ? ' [OFFLINE]' : '';
        lines.push(
          `- ${s.name}${typeInfo} (ID: ${s.id}${capInfo}): Capacity ${u.capacityLevel}/5, Water ${u.waterLevel}/5, Food ${u.foodLevel}/5, Medical ${u.medicalLevel}/5` +
          (u.notes ? ` — "${u.notes}"` : '') +
          ` (updated ${formatTimeSince(u.createdAt)})${offlineTag}`
        );
      } else {
        lines.push(`- ${s.name}${typeInfo} (ID: ${s.id}${capInfo}): No reports submitted`);
      }
    }
  }
  return lines.join('\n');
};

export const analyzeNetwork = async (
  disasterEvent: DisasterEvent,
  shelterData: ShelterWithUpdate[]
): Promise<AiRecommendationItem[]> => {
  const systemPrompt = `You are IRIS (Intelligent Response & Insight System), the AI engine powering Jamaica's Disaster Preparedness & Response Platform (DPRP).

You speak with authority as the platform's built-in intelligence system. You don't say "I recommend" — you say "IRIS analysis indicates" or "Based on IRIS assessment." You are part of the system, not an external advisor.

Your recommendations are directives, not suggestions. You reference specific shelter names, parishes, and data points. You are precise, actionable, and urgent when the situation demands it.

You are analyzing shelter data during ${disasterEvent.name} (Category ${disasterEvent.category ?? 'N/A'}).
Affected parishes: ${disasterEvent.affectedParishes.join(', ')}

Current shelter network status:
${formatShelterData(shelterData)}

IMPORTANT GUIDELINES:
- Reference the Network Summary statistics and specific shelter data points in your reasoning.
- Shelters marked [OFFLINE] still need aid — their last reported status is still valid until a new update changes it. Factor offline shelters into your analysis.
- Use max capacity numbers (when available) to assess how many people may be affected.
- Prioritize shelters with capacity 5/5 or any resource at 1/5 as highest urgency.
- Consider parish-level patterns — if multiple shelters in one parish are critical, that parish needs coordinated response.

Based on this data, provide your top 3-5 prioritized recommendations.
For each recommendation, return JSON:
{ "target_shelter_id": "shelter-uuid-or-null", "type": "redirect"|"resupply"|"dispatch_team"|"consolidate"|"evacuate", "priority": "critical"|"high"|"medium"|"low", "recommendation": "one sentence using IRIS voice", "reasoning": "2-3 sentences referencing specific data points" }

Return ONLY a JSON array, no markdown fences, no preamble.`;

  const response = await Promise.race([
    client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: 'Analyze the current shelter network and provide recommendations.' }],
      system: systemPrompt,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), TIMEOUT_MS)
    ),
  ]);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  try {
    const parsed = JSON.parse(stripCodeFences(text)) as AiRecommendationItem[];
    if (!Array.isArray(parsed)) throw new Error('Response is not an array');
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${err instanceof Error ? err.message : 'Unknown error'}. Raw: ${text.slice(0, 500)}`);
  }
};

const formatHistoricalData = (
  events: Array<DisasterEvent & { updates: Array<ShelterUpdate & { shelter: Shelter }> }>
): string => {
  const lines: string[] = [];
  for (const event of events) {
    lines.push(`\n### ${event.name} (Category ${event.category ?? 'N/A'}, Wind: ${event.windSpeedMph ?? 'N/A'} mph)`);
    lines.push(`Affected parishes: ${event.affectedParishes.join(', ')}`);
    lines.push(`Duration: ${event.startDate.toISOString()} to ${event.endDate?.toISOString() ?? 'ongoing'}`);
    lines.push(`Total updates: ${event.updates.length}`);

    // Sort updates by time and show timeline summary
    const sorted = [...event.updates].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const start = event.startDate.getTime();

    // Group into phases
    const early = sorted.filter(u => u.createdAt.getTime() - start < 8 * 3600_000);
    const mid = sorted.filter(u => {
      const h = (u.createdAt.getTime() - start) / 3600_000;
      return h >= 8 && h < 24;
    });
    const late = sorted.filter(u => (u.createdAt.getTime() - start) / 3600_000 >= 24);

    const summarizePhase = (phase: typeof sorted, label: string) => {
      if (!phase.length) return;
      const avgCap = phase.reduce((s, u) => s + u.capacityLevel, 0) / phase.length;
      const avgWater = phase.reduce((s, u) => s + u.waterLevel, 0) / phase.length;
      const avgFood = phase.reduce((s, u) => s + u.foodLevel, 0) / phase.length;
      lines.push(`  ${label}: avg capacity ${avgCap.toFixed(1)}, water ${avgWater.toFixed(1)}, food ${avgFood.toFixed(1)} (${phase.length} updates)`);
    };

    summarizePhase(early, 'Early (0-8h)');
    summarizePhase(mid, 'Mid (8-24h)');
    summarizePhase(late, 'Late (24h+)');

    // List affected shelters
    const shelterNames = [...new Set(sorted.map(u => u.shelter.name))];
    lines.push(`  Shelters affected: ${shelterNames.join(', ')}`);
  }
  return lines.join('\n');
};

export const predictPreparedness = async (
  approachingEvent: DisasterEvent,
  historicalData: Array<DisasterEvent & { updates: Array<ShelterUpdate & { shelter: Shelter }> }>
): Promise<AiPredictionResult> => {
  const systemPrompt = `You are IRIS (Intelligent Response & Insight System), the AI engine powering Jamaica's Disaster Preparedness & Response Platform (DPRP).

You speak with authority as the platform's built-in intelligence system. You don't say "I recommend" — you say "IRIS analysis indicates" or "Based on IRIS assessment." You are part of the system, not an external advisor.

Your recommendations are directives, not suggestions. You reference specific shelter names, parishes, and data points. You are precise, actionable, and urgent when the situation demands it.

An approaching weather event:
- Name: ${approachingEvent.name}, Category: ${approachingEvent.category ?? 'N/A'}, Wind speed: ${approachingEvent.windSpeedMph ?? 'N/A'} mph
- Projected affected parishes: ${approachingEvent.affectedParishes.join(', ')}
- Projected landfall: ${approachingEvent.landfallDate?.toISOString() ?? 'unknown'}

Historical data from previous events:
${formatHistoricalData(historicalData)}

Based on IRIS historical modeling, generate a preparedness forecast:
1. Which shelters will reach capacity first? (reference specific shelter names)
2. Which resources will deplete soonest? (reference specific timelines)
3. Pre-positioning directives with specific quantities and target shelters
4. Projected response timeline with milestones

Return ONLY JSON: { "predictions": [{"shelterName": "...", "estimatedCapacityReachTime": "T+Xh", "confidence": "high|medium|low"}], "prePositioning": [{"shelterId": "...", "resource": "water|food|medical", "quantity": "...", "rationale": "..."}], "timeline": {"hoursToFirstCapacity": N, "hoursToResourceDepletion": N, "milestones": [{"hour": N, "event": "description", "severity": "green|amber|red"}], "summary": "..."} }`;

  const response = await Promise.race([
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: 'Predict preparedness needs for the approaching event based on historical data.' }],
      system: systemPrompt,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI request timed out after 30 seconds')), TIMEOUT_MS)
    ),
  ]);

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map(block => block.text)
    .join('');

  try {
    const parsed = JSON.parse(stripCodeFences(text)) as AiPredictionResult;
    if (!parsed.predictions || !parsed.prePositioning) {
      throw new Error('Missing required fields in prediction response');
    }
    return parsed;
  } catch (err) {
    throw new Error(`Failed to parse AI prediction: ${err instanceof Error ? err.message : 'Unknown error'}. Raw: ${text.slice(0, 500)}`);
  }
};
