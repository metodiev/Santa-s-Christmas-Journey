import { describe, expect, it } from 'vitest';
import { BUILT_TRACKS, TRACKS, buildTrack, chordMidi, midiToFreq, noteToMidi, parseMelody } from '../src/audio/tracks';

describe('note helpers', () => {
  it('converts scientific pitch names to MIDI numbers', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('C#4')).toBe(61);
    expect(noteToMidi('Db4')).toBe(61);
    expect(noteToMidi('B3')).toBe(59);
    expect(noteToMidi('C-1')).toBe(0);
    expect(noteToMidi('nonsense')).toBe(60);
  });

  it('converts MIDI to equal-tempered frequencies', () => {
    expect(midiToFreq(69)).toBeCloseTo(440);
    expect(midiToFreq(60)).toBeCloseTo(261.63, 1);
    expect(midiToFreq(81)).toBeCloseTo(880);
  });

  it('builds triads and sevenths in the requested octave', () => {
    expect(chordMidi('C', 4)).toEqual([60, 64, 67]);
    expect(chordMidi('Am', 4)).toEqual([69, 72, 76]);
    expect(chordMidi('G7', 3)).toEqual([55, 59, 62, 65]);
    expect(chordMidi('Dmaj7', 4)).toEqual([62, 66, 69, 73]);
    expect(chordMidi('???')).toEqual([60, 64, 67]);
  });
});

describe('melody parser', () => {
  it('tracks beats, rests and chords', () => {
    const events = parseMelody('C4/1 R/0.5 E4/0.5 G4,C5/2');
    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({ beat: 0, dur: 1, notes: [60], voice: 'lead' });
    expect(events[1]).toMatchObject({ beat: 1.5, dur: 0.5, notes: [64] });
    expect(events[2]).toMatchObject({ beat: 2, dur: 2, notes: [67, 72] });
  });

  it('returns an empty score for blank input', () => {
    expect(parseMelody('   ')).toEqual([]);
  });
});

describe('built soundtrack', () => {
  it('ships and builds every referenced track', () => {
    expect(Object.keys(TRACKS).length).toBeGreaterThanOrEqual(8);
    for (const [id, track] of Object.entries(TRACKS)) {
      expect(track.id).toBe(id);
      expect(track.bpm).toBeGreaterThan(40);
      expect(track.bpm).toBeLessThan(220);
      expect(track.beatsPerBar).toBeGreaterThanOrEqual(3);
      expect(track.chords.length).toBeGreaterThan(0);
      const built = BUILT_TRACKS[id];
      expect(built.loopBeats).toBeGreaterThan(0);
      expect(built.events.length).toBeGreaterThan(0);
      expect(built.events.every((event) => event.dur > 0 && event.beat >= 0)).toBe(true);
      expect(built.events).toEqual([...built.events].sort((a, b) => a.beat - b.beat));
    }
  });

  it('loops for at least one complete bar and lays pads on bar boundaries', () => {
    const track = buildTrack({
      id: 'test', title: 'Test', bpm: 120, beatsPerBar: 4,
      melody: 'C4/4 D4/4 E4/4 F4/4', chords: ['C', 'G'], lead: 'triangle',
      pad: 'sine', bass: 'root', drums: 'none', gain: 0.5, loop: true,
    });
    expect(track.loopBeats).toBe(16);
    const pads = track.events.filter((event) => event.voice === 'pad');
    expect(pads.map((event) => event.beat)).toEqual([0, 4]);
    expect(pads.every((event) => event.dur === 4)).toBe(true);
  });

  it('supports silent pads, basses and drums', () => {
    const track = buildTrack({
      id: 'silent', title: 'Silent', bpm: 90, beatsPerBar: 4,
      melody: 'C4/4', chords: ['C'], lead: 'sine', pad: 'none', bass: 'none', drums: 'none',
    });
    expect(track.events.every((event) => event.voice === 'lead')).toBe(true);
  });
});
