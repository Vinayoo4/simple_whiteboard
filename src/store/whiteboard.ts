import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  userId: string;
}

interface WhiteboardState {
  strokes: Stroke[];
  currentStroke: Point[];
  color: string;
  width: number;
  isDrawing: boolean;
  addPoint: (point: Point) => void;
  startDrawing: () => void;
  stopDrawing: () => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  clearBoard: () => void;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  strokes: [],
  currentStroke: [],
  color: '#000000',
  width: 2,
  isDrawing: false,

  addPoint: (point) => {
    if (!get().isDrawing) return;
    
    set((state) => ({
      currentStroke: [...state.currentStroke, point]
    }));

    // Broadcast the point to other users
    supabase.channel('whiteboard')
      .send({
        type: 'broadcast',
        event: 'new-point',
        payload: {
          point,
          color: get().color,
          width: get().width
        }
      });
  },

  startDrawing: () => set({ isDrawing: true }),

  stopDrawing: () => {
    const { currentStroke, color, width } = get();
    if (currentStroke.length === 0) return;

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      points: currentStroke,
      color,
      width,
      userId: 'user-' + Math.random().toString(36).substr(2, 9)
    };

    set((state) => ({
      strokes: [...state.strokes, newStroke],
      currentStroke: [],
      isDrawing: false
    }));

    // Save the stroke to Supabase
    supabase.from('strokes').insert([newStroke]);
  },

  setColor: (color) => set({ color }),
  setWidth: (width) => set({ width }),
  clearBoard: () => set({ strokes: [], currentStroke: [] })
}));