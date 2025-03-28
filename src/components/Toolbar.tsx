import React from 'react';
import { useWhiteboardStore } from '../store/whiteboard';
import { Eraser, Pencil, Trash2 } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const { setColor, setWidth, clearBoard } = useWhiteboardStore();

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      <button
        onClick={() => setColor('#000000')}
        className="p-2 hover:bg-gray-100 rounded-lg"
        title="Pencil"
      >
        <Pencil className="w-6 h-6" />
      </button>
      
      <button
        onClick={() => setColor('#FFFFFF')}
        className="p-2 hover:bg-gray-100 rounded-lg"
        title="Eraser"
      >
        <Eraser className="w-6 h-6" />
      </button>

      <div className="h-6 border-r border-gray-300" />

      <select
        onChange={(e) => setWidth(Number(e.target.value))}
        className="p-2 border rounded-lg"
      >
        <option value="2">Thin</option>
        <option value="4">Medium</option>
        <option value="6">Thick</option>
      </select>

      <input
        type="color"
        onChange={(e) => setColor(e.target.value)}
        className="w-8 h-8 p-1 border rounded"
      />

      <div className="h-6 border-r border-gray-300" />

      <button
        onClick={clearBoard}
        className="p-2 hover:bg-gray-100 rounded-lg text-red-500"
        title="Clear Board"
      >
        <Trash2 className="w-6 h-6" />
      </button>
    </div>
  );
};