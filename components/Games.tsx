import React, { useState, useEffect, useCallback } from 'react';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  render: () => React.ReactNode;
}

export const Games: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  // Game 1: Breathing Exercise
  const BreathingGame = () => {
    useEffect(() => {
      const interval = setInterval(() => {
        setBreathPhase(prev => {
          if (prev === 'inhale') return 'hold';
          if (prev === 'hold') return 'exhale';
          setBreathCount(c => c + 1);
          return 'inhale';
        });
      }, 4000);

      return () => clearInterval(interval);
    }, []);

    const phaseText = {
      inhale: 'Inspire...',
      hold: 'Segure...',
      exhale: 'Expire...'
    };

    const phaseColor = {
      inhale: 'bg-blue-500',
      hold: 'bg-green-500',
      exhale: 'bg-purple-500'
    };

    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className={`w-32 h-32 rounded-full ${phaseColor[breathPhase]} transition-all duration-1000 flex items-center justify-center text-white text-center`}>
          <span className="text-sm font-bold">{phaseText[breathPhase]}</span>
        </div>
        <p className="mt-4 text-slate-300">Respirações completadas: {breathCount}</p>
      </div>
    );
  };

  // Game 2: Color Relaxation
  const ColorGame = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const [currentColor, setCurrentColor] = useState(0);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentColor(prev => (prev + 1) % colors.length);
      }, 3000);

      return () => clearInterval(interval);
    }, []);

    return (
      <div 
        className="w-full h-64 rounded-xl transition-colors duration-1000 flex items-center justify-center"
        style={{ backgroundColor: colors[currentColor] }}
      >
        <p className="text-white text-xl font-bold">Respire e relaxe...</p>
      </div>
    );
  };

  // Game 3: Zen Garden (Simple clicker)
  const ZenGarden = () => {
    const [stones, setStones] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const [nextId, setNextId] = useState(1);

    const addStone = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setStones(prev => [...prev, { id: nextId, x, y }]);
      setNextId(id => id + 1);
    }, [nextId]);

    const clearStones = () => {
      setStones([]);
      setNextId(1);
    };

    return (
      <div className="flex flex-col items-center">
        <div 
          className="w-full h-64 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl relative cursor-pointer overflow-hidden"
          onClick={addStone}
        >
          {stones.map(stone => (
            <div
              key={stone.id}
              className="absolute w-8 h-6 bg-slate-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{ left: stone.x, top: stone.y }}
            />
          ))}
        </div>
        <button 
          onClick={clearStones}
          className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Limpar Jardim
        </button>
      </div>
    );
  };

  const games: Game[] = [
    {
      id: 'breathing',
      name: 'Respiração Guiada',
      description: 'Exercício de respiração 4-4-4 para relaxamento',
      icon: '🫁',
      color: 'bg-blue-500',
      render: () => <BreathingGame />
    },
    {
      id: 'colors',
      name: 'Cromoterapia',
      description: 'Cores suaves para relaxamento visual',
      icon: '🎨',
      color: 'bg-purple-500',
      render: () => <ColorGame />
    },
    {
      id: 'zen',
      name: 'Jardim Zen',
      description: 'Crie seu jardim de pedras virtual',
      icon: '🏔️',
      color: 'bg-amber-600',
      render: () => <ZenGarden />
    }
  ];

  if (activeGame) {
    const game = games.find(g => g.id === activeGame);
    if (!game) return null;

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
            <span>{game.icon}</span>
            {game.name}
          </h2>
          <button
            onClick={() => setActiveGame(null)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            Voltar
          </button>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6">
          {game.render()}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-200 mb-6">Jogos de Descompressão</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`${game.color} p-6 rounded-xl text-white hover:opacity-90 transition-opacity text-left`}
          >
            <div className="text-4xl mb-2">{game.icon}</div>
            <h3 className="text-lg font-bold mb-1">{game.name}</h3>
            <p className="text-sm opacity-90">{game.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Games;
