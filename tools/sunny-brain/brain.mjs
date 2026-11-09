/** Digital-Brain-inspired lightweight cognition for clansmen dialogue. No world actions. */
export function createClanBrain({ name = 'Clansman', role = 'villager' } = {}) {
  const memory = [];
  let mood = 0;
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
    if (stimulus) remember(stimulus, /hurt|attack|mad|danger|death|skeleton/i.test(stimulus) ? -0.6 : /greet|trade|thanks|gift|hello/i.test(stimulus) ? 0.4 : 0.05);
    return { identity, mood, curiosity, recent: memory.slice(-6), internalState: { mood, curiosity } };
  }
  function systemPrompt(ctx = {}) {
    const st = cycle(ctx.stimulus || '');
    return [
      `You are ${identity.name}, a highland clansman (${identity.role}).`,
      'Speak aloud in first person as yourself to a nearby traveller.',
      'Reply with ONE short sentence, under 16 words.',
      'Plain English with a light Scots flavour is fine. Do not force broken dialect.',
      'Do not narrate, give stage directions, or tell anyone what to do.',
      'Do not say phrases like "alert the traveller", "warn the player", or "as an AI".',
      'No quotes, lists, code, URLs, or commands.',
      `Mood(-1..1): ${st.mood.toFixed(2)}.`
    ].join(' ');
  }
  return { identity, remember, cycle, systemPrompt, get state() { return { mood, curiosity, memory: memory.slice(), identity }; } };
}

export function sanitizeSpoken(text) {
  let s = String(text || '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^(Clansman|Assistant|AI|Bot|Hamish|Angus)\s*:\s*/i, '');
  s = s.replace(/^["'`]+/, '');
  const m = s.match(/^.*?[.!?](?=["'`\s]|$)/);
  if (m) s = m[0];
  s = s.replace(/["'`]+$/g, '').trim();
  const words = s.split(/\s+/).filter(Boolean).slice(0, 16);
  s = words.join(' ');
  if (/```|https?:|javascript:|localStorage|eval\(|\brm -|sudo /i.test(s)) return '';
  return s;
}

/** Reject meta/instructional/nonsensical lines; keep plain dialogue. */
export function looksSpoken(s) {
  if (!s || s.length < 2) return false;
  if (/as an ai|language model|I cannot|cannot provide/i.test(s)) return false;
  if (/\b(alert|warn|instruct|tell|advise|inform)\b.*\b(traveller|traveler|player|user)\b/i.test(s)) return false;
  if (/\b(the traveller should|you should say|stage direction)\b/i.test(s)) return false;
  if (/dung drops from the sun|motherboard|cliquez|utilizator/i.test(s)) return false;
  const weird = [...s].filter(c => c.charCodeAt(0) > 126).length;
  if (weird > 2) return false;
  const letters = [...s].filter(c => /[A-Za-z]/.test(c)).length;
  return letters >= 4;
}
