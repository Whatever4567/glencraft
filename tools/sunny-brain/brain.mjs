/** Digital-Brain-inspired lightweight cognition wrapper for clansmen dialogue.
 *  Ported concepts (identity, memory, mood, communication) from the uploaded
 *  digital-brain project. Does NOT execute model-suggested world actions.
 */
export function createClanBrain({ name = 'Clansman', role = 'villager' } = {}) {
  const memory = [];
  let mood = 0; // -1..1
  let curiosity = 0.4;
  const identity = {
    name,
    role,
    core_values: ['loyalty', 'hospitality', 'honesty'],
    self_description: `A Scottish highland clansman (${role}) in Glencraft.`
  };
  function remember(event, valence = 0) {
    memory.push({ t: Date.now(), event: String(event).slice(0, 240), valence });
    if (memory.length > 24) memory.shift();
    mood = Math.max(-1, Math.min(1, mood * 0.85 + valence * 0.35));
    curiosity = Math.max(0.1, Math.min(1, curiosity + (Math.abs(valence) < 0.1 ? 0.02 : -0.01)));
  }
  function cycle(stimulus = '') {
    if (stimulus) remember(stimulus, /hurt|attack|mad|danger|death/i.test(stimulus) ? -0.6 : /greet|trade|thanks|gift|hello/i.test(stimulus) ? 0.4 : 0.05);
    return {
      identity,
      mood,
      curiosity,
      recent: memory.slice(-6),
      internalState: { mood, curiosity }
    };
  }
  function systemPrompt(ctx = {}) {
    const st = cycle(ctx.stimulus || '');
    const rec = st.recent.map(m => `- ${m.event}`).join('\n') || '- none yet';
    return [
      'You are a Glencraft highland clansman speaking aloud to a nearby traveller.',
      'Reply in short intelligible Scots-tinged English, 1 short sentence, under 18 words.',
      'No telepathy captions, no stage directions, no quotes, no lists, no code, no commands.',
      'Do not invent game cheats, item spawns, or ask the player to run commands.',
      `Name: ${identity.name}. Role: ${identity.role}. Mood(-1..1): ${st.mood.toFixed(2)}. Curiosity: ${st.curiosity.toFixed(2)}.`,
      `Recent memories:\n${rec}`,
      ctx.world ? `World: ${ctx.world}` : ''
    ].filter(Boolean).join('\n');
  }
  return { identity, remember, cycle, systemPrompt, get state() { return { mood, curiosity, memory: memory.slice(), identity }; } };
}

export function sanitizeSpoken(text) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(Clansman|Assistant|AI|Bot)\s*:\s*/i, '');
  // first sentence-ish chunk
  const m = s.match(/^.*?[.!?](?=[\"'`\s]|$)/);
  if (m) s = m[0];
  s = s.replace(/^[\"'`]+/, '').replace(/[\"'`]+$/g, '').trim();
  const words = s.split(' ').filter(Boolean).slice(0, 18);
  s = words.join(' ');
  if (s.length > 140) s = s.slice(0, 140).replace(/\s+\S*$/, '');
  if (/```|https?:|javascript:|localStorage|eval\(|rm -|sudo /i.test(s)) return '';
  return s;
}
