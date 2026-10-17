let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.08) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(at: number, dur: number, vol = 0.05) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + at;
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  gain.gain.value = vol;
  src.buffer = buffer;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
}

export const sfx = {
  spin() {
    noise(0, 0.18, 0.06);
    tone(220, 0, 0.12, "triangle", 0.05);
  },
  win() {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.18, "triangle", 0.07));
  },
  jackpot() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.3, "square", 0.06));
    noise(0, 0.4, 0.05);
  },
  bonus() {
    [330, 415, 494, 622, 740].forEach((f, i) => tone(f, i * 0.12, 0.25, "sawtooth", 0.05));
  },
};