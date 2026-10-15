import { describe, expect, it } from "vitest";
import { DEFAULT_AUDIO, audio, clampVolume } from "../lib/audio";
import { BPM, CHORDS, ROOTS, mtof, playStep, type MusicMode } from "../lib/music";

describe("audio settings", () => {
  it("clamps the volume between 0 and 1 and ignores garbage", () => {
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(Number.NaN)).toBe(DEFAULT_AUDIO.volume);
  });
  it("updates and notifies listeners", () => {
    let calls = 0;
    const off = audio.subscribe(() => calls++);
    audio.set({ music: false, volume: 3 });
    expect(audio.get().music).toBe(false);
    expect(audio.get().volume).toBe(1);
    expect(calls).toBe(1);
    audio.set({ music: true, volume: DEFAULT_AUDIO.volume });
    off();
  });
});

describe("music", () => {
  it("uses the right pitch for A440 and octaves", () => {
    expect(mtof(69)).toBeCloseTo(440, 5);
    expect(mtof(81)).toBeCloseTo(880, 5);
  });
  it("has a 4-chord loop with matching bass roots and a faster bonus tempo", () => {
    expect(CHORDS).toHaveLength(4);
    expect(ROOTS).toHaveLength(4);
    CHORDS.forEach((c, i) => expect((c[0] - ROOTS[i]) % 12).toBe(0)); // la basse joue la fondamentale
    expect(BPM.calm).toBeLessThan(BPM.normal);
    expect(BPM.normal).toBeLessThan(BPM.bonus);
  });
});

// Faux contexte audio : compte les sons créés, sans rien jouer
function fakeBus() {
  const stats = { sources: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = (): Record<string, unknown> => {
    const n: Record<string, unknown> = {
      frequency: param(), gain: param(), detune: param(), type: "", buffer: null,
      connect: (x: unknown) => x, start() { stats.sources++; }, stop() {},
    };
    return n;
  };
  const ctx = {
    currentTime: 0, sampleRate: 8000,
    createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node,
    createBuffer: () => ({ sampleRate: 8000, getChannelData: () => new Float32Array(8000) }),
  };
  const dest = node();
  return { bus: { ctx, sfx: dest, music: dest, duck: dest } as never, stats };
}

describe("music sequencer", () => {
  it("plays 4 bars in every mode without errors, and the bonus is the busiest", () => {
    const counts = {} as Record<MusicMode, number>;
    (["calm", "normal", "bonus"] as MusicMode[]).forEach((m) => {
      const { bus, stats } = fakeBus();
      for (let i = 0; i < 64; i++) playStep(bus, i * 0.1, i, m);
      counts[m] = stats.sources;
      expect(stats.sources).toBeGreaterThan(0);
    });
    expect(counts.calm).toBeLessThan(counts.normal);
    expect(counts.normal).toBeLessThan(counts.bonus);
  });
});