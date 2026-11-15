export interface NPCSpawnPoint {
  id: string;
  x: number;
  y: number;
  segmentId: string;
  interactionRadius: number;
  name?: string;
  questId?: string;
  npcId?: string;
}

export const NPC_SPAWN_POINTS: NPCSpawnPoint[] = [
  { id: 'npc-street-01', x: 620, y: 515, segmentId: 'seg-01-street', interactionRadius: 90 },
  { id: 'npc-street-02', x: 1280, y: 520, segmentId: 'seg-01-street', interactionRadius: 90 }, 
  { id: 'npc-street-03', x: 1780, y: 490, segmentId: 'seg-01-street', interactionRadius: 90 },
  { id: 'npc-market-01', x: 2420, y: 500, segmentId: 'seg-02-market', interactionRadius: 100 },
  { id: 'npc-market-02', x: 2990, y: 545, segmentId: 'seg-02-market', interactionRadius: 100 },
  { id: 'npc-market-03', x: 3560, y: 505, segmentId: 'seg-02-market', interactionRadius: 100 },
  { id: 'npc-approach-01', x: 4300, y: 475, segmentId: 'seg-03-approach', interactionRadius: 100 },
  { id: 'npc-approach-02', x: 5200, y: 445, segmentId: 'seg-03-approach', interactionRadius: 100 },
  { id: 'npc-approach-03', x: 6000, y: 420, segmentId: 'seg-03-approach', interactionRadius: 100 },
  { id: 'npc-court-01', x: 6900, y: 400, segmentId: 'seg-04-court', interactionRadius: 110, npcId: 'fariseu' },
  { id: 'npc-court-02', x: 7500, y: 410, segmentId: 'seg-04-court', interactionRadius: 110, npcId: 'publicano' },
];
