import React from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { Pencil } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2">
          <Pencil className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900">Virtual Whiteboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Toolbar />
          <div className="flex justify-center">
            <Canvas />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;