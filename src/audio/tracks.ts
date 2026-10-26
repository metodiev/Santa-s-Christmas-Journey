import menuScore from '../../assets/audio/music/menu.json';
import jingleScore from '../../assets/audio/music/jingle.json';
import tannenbaumScore from '../../assets/audio/music/tannenbaum.json';
import workshopScore from '../../assets/audio/music/workshop.json';
import silentScore from '../../assets/audio/music/silent.json';
import bellsScore from '../../assets/audio/music/bells.json';
import bossScore from '../../assets/audio/music/boss.json';
import victoryScore from '../../assets/audio/music/victory.json';

export interface TrackData {
  id: string;
  title: string;
  bpm: number;
  beatsPerBar: number;
  melody: string;
  chords: string[];
  lead: string;
  pad: string;
  bass: string;
  drums: string;
  gain?: number;
  loop?: boolean;
}

export interface MusicEvent {
  beat: number;
  dur: number;
  notes: number[];
  voice: string;
  gain: number;
}

export interface BuiltTrack {
  data: TrackData;
  events: MusicEvent[];
  loopBeats: number;
}

const rawTracks = [menuScore, jingleScore, tannenbaumScore, workshopScore, silentScore, bellsScore, bossScore, victoryScore] as unknown as TrackData[];
export const TRACKS: Record<string, TrackData> = Object.fromEntries(rawTracks.map((track) => [track.id, track]));

const SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5,
  'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11,
};

const CHORDS: Record<string, number[]> = {
  '': [0, 4, 7],
  m: [0, 3, 7],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  maj7: [0, 4, 7, 11],
  dim: [0, 3, 6],
  sus4: [0, 5, 7],
};

export function noteToMidi(note: string): number {
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(note.trim());
  if (!match) return 60;
  const semitone = SEMITONES[`${match[1]}${match[2]}`] ?? 0;
  const octave = Number(match[3]);
  return (octave + 1) * 12 + semitone;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function chordMidi(symbol: string, octave = 4): number[] {
  const match = /^([A-G][#b]?)(.*)$/.exec(symbol);
  if (!match) return [60, 64, 67];
  const root = SEMITONES[match[1]] ?? 0;
  const intervals = CHORDS[match[2]] ?? CHORDS[''];
  return intervals.map((interval) => root + interval + (octave + 1) * 12);
}

export function parseMelody(melody: string): MusicEvent[] {
  const events: MusicEvent[] = [];
  let beat = 0;
  for (const token of melody.trim().split(/\s+/).filter(Boolean)) {
    const [notePart, durPart] = token.split('/');
    const dur = Number(durPart ?? 1);
    const notes = notePart
      .split(',')
      .filter((n) => n && n !== 'R')
      .map(noteToMidi);
    if (notes.length) {
      events.push({ beat, dur, notes, voice: 'lead', gain: 1 });
    }
    beat += dur;
  }
  return events;
}

function addDrums(events: MusicEvent[], style: string, bars: number, bpb: number): void {
  if (style === 'none') return;
  for (let bar = 0; bar < bars; bar++) {
    const base = bar * bpb;
    const add = (beat: number, voice: string, gain = 0.5) => events.push({ beat: base + beat, dur: 0.15, notes: [], voice, gain });
    if (style === 'sleigh') {
      for (let b = 0; b < bpb; b++) {
        add(b, 'sleigh', 0.32);
        add(b + 0.5, 'shaker', 0.18);
      }
    } else if (style === 'soft') {
      add(0, 'soft-kick', 0.4);
      add(2, 'shaker', 0.16);
      add(1, 'brush', 0.14);
      add(3, 'brush', 0.14);
    } else if (style === 'workshop') {
      for (let b = 0; b < bpb; b++) add(b, 'tick', b % 2 === 0 ? 0.22 : 0.13);
      add(0, 'soft-kick', 0.3);
      add(2, 'soft-kick', 0.26);
    } else if (style === 'march') {
      add(0, 'kick', 0.65);
      add(2, 'kick', 0.55);
      add(1, 'snare', 0.4);
      add(3, 'snare', 0.45);
      for (let b = 0; b < bpb; b++) add(b + 0.5, 'shaker', 0.12);
    } else if (style === 'bells') {
      for (let b = 0; b < bpb; b++) add(b, 'sleigh', 0.3);
      add(1, 'soft-kick', 0.25);
    }
  }
}

export function buildTrack(data: TrackData): BuiltTrack {
  const events: MusicEvent[] = [];
  const melody = parseMelody(data.melody);
  events.push(...melody);
  const melodyEnd = melody.reduce((max, e) => Math.max(max, e.beat + e.dur), 0);
  const bars = Math.max(1, data.chords.length);
  const chordBeats = bars * data.beatsPerBar;
  const loopBeats = Math.max(melodyEnd, chordBeats);

  for (let bar = 0; bar < bars; bar++) {
    const symbol = data.chords[bar];
    const base = bar * data.beatsPerBar;
    if (data.pad !== 'none') {
      events.push({ beat: base, dur: data.beatsPerBar, notes: chordMidi(symbol, 4), voice: 'pad', gain: 0.3 });
    }
    if (data.bass !== 'none') {
      const notes = chordMidi(symbol, 2);
      if (data.bass === 'walk') {
        const root = notes[0];
        const fifth = root + 7;
        const third = notes[1];
        [root, fifth, third + 12, fifth].forEach((note, i) => {
          events.push({ beat: base + i * (data.beatsPerBar / 4), dur: 0.7, notes: [note], voice: 'bass', gain: 0.55 });
        });
      } else {
        events.push({ beat: base, dur: 1.6, notes: [notes[0]], voice: 'bass', gain: 0.5 });
        if (data.beatsPerBar >= 4) events.push({ beat: base + 2, dur: 1.5, notes: [notes[0] + 7], voice: 'bass', gain: 0.4 });
      }
    }
  }
  addDrums(events, data.drums, bars, data.beatsPerBar);
  events.sort((a, b) => a.beat - b.beat);
  return { data, events, loopBeats };
}

export const BUILT_TRACKS: Record<string, BuiltTrack> = Object.fromEntries(rawTracks.map((data) => [data.id, buildTrack(data)]));
