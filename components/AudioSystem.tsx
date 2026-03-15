import React, { useState, useEffect, useRef } from 'react';

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  category: 'nature' | 'meditation' | 'ambient' | 'binaural';
  duration: number;
}

interface MeditationTimer {
  duration: number;
  isActive: boolean;
  timeRemaining: number;
}

export const AudioSystem: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [timer, setTimer] = useState<MeditationTimer>({
    duration: 10,
    isActive: false,
    timeRemaining: 600
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const tracks: AudioTrack[] = [
    {
      id: 'rain',
      name: 'Chuva Relaxante',
      url: '/audio/rain.mp3',
      category: 'nature',
      duration: 1800
    },
    {
      id: 'ocean',
      name: 'Ondas do Oceano',
      url: '/audio/ocean.mp3',
      category: 'nature',
      duration: 1800
    },
    {
      id: 'forest',
      name: 'Floresta',
      url: '/audio/forest.mp3',
      category: 'nature',
      duration: 1800
    },
    {
      id: 'meditation1',
      name: 'Meditação Guiada - 10min',
      url: '/audio/meditation10.mp3',
      category: 'meditation',
      duration: 600
    },
    {
      id: 'meditation2',
      name: 'Meditação Guiada - 20min',
      url: '/audio/meditation20.mp3',
      category: 'meditation',
      duration: 1200
    },
    {
      id: 'ambient1',
      name: 'Ambiente Zen',
      url: '/audio/zen.mp3',
      category: 'ambient',
      duration: 3600
    },
    {
      id: 'ambient2',
      name: 'Espaço Profundo',
      url: '/audio/space.mp3',
      category: 'ambient',
      duration: 3600
    },
    {
      id: 'binaural1',
      name: 'Foco e Concentração',
      url: '/audio/focus.mp3',
      category: 'binaural',
      duration: 1800
    },
    {
      id: 'binaural2',
      name: 'Relaxamento Profundo',
      url: '/audio/deep-relax.mp3',
      category: 'binaural',
      duration: 1800
    }
  ];

  const categories = [
    { id: 'all', name: 'Todos', icon: '🎵' },
    { id: 'nature', name: 'Natureza', icon: '🌿' },
    { id: 'meditation', name: 'Meditação', icon: '🧘' },
    { id: 'ambient', name: 'Ambiente', icon: '✨' },
    { id: 'binaural', name: 'Binaural', icon: '🎧' }
  ];

  const filteredTracks = activeCategory === 'all' 
    ? tracks 
    : tracks.filter(t => t.category === activeCategory);

  const playTrack = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    
    // Reset timer if meditation track
    if (track.category === 'meditation') {
      setTimer({
        duration: Math.floor(track.duration / 60),
        isActive: true,
        timeRemaining: track.duration
      });
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setCurrentTrack(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimer(prev => ({ ...prev, isActive: false }));
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer effect
  useEffect(() => {
    if (timer.isActive && timer.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    } else if (timer.timeRemaining === 0) {
      stopPlayback();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer.isActive, timer.timeRemaining]);

  // Audio playback simulation
  useEffect(() => {
    // In a real implementation, this would control the actual audio element
    console.log(isPlaying ? 'Playing:' : 'Paused:', currentTrack?.name);
  }, [isPlaying, currentTrack]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-slate-200 mb-6">Áudio e Meditação</h2>

      {/* Now Playing Card */}
      {currentTrack && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Tocando agora</p>
              <h3 className="text-xl font-bold">{currentTrack.name}</h3>
              <p className="text-sm opacity-75">
                {categories.find(c => c.id === currentTrack.category)?.name}
              </p>
            </div>
            <button
              onClick={stopPlayback}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: isPlaying ? '100%' : '0%' }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-14 h-14 bg-white text-purple-600 rounded-full flex items-center justify-center text-2xl font-bold hover:scale-105 transition-transform"
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            
            <div className="flex-1">
              <label className="text-xs opacity-75 mb-1 block">Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => adjustVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Timer Display */}
          {timer.isActive && (
            <div className="mt-4 text-center">
              <p className="text-3xl font-mono font-bold">
                {formatTime(timer.timeRemaining)}
              </p>
              <p className="text-sm opacity-75">Tempo restante</p>
            </div>
          )}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Quick Timer Presets */}
      {!currentTrack && (
        <div className="bg-slate-800 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-slate-200 mb-3">Timer de Meditação</h3>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 30].map(minutes => (
              <button
                key={minutes}
                onClick={() => setTimer({
                  duration: minutes,
                  isActive: true,
                  timeRemaining: minutes * 60
                })}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                {minutes}min
              </button>
            ))}
          </div>
          
          {timer.isActive && (
            <div className="mt-4 text-center p-4 bg-blue-900/30 rounded-lg">
              <p className="text-4xl font-mono font-bold text-blue-300">
                {formatTime(timer.timeRemaining)}
              </p>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={() => setTimer(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  {timer.isActive ? 'Pausar' : 'Continuar'}
                </button>
                <button
                  onClick={() => {
                    setTimer(prev => ({
                      ...prev,
                      isActive: false,
                      timeRemaining: prev.duration * 60
                    }));
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  Resetar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Track List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTracks.map(track => (
          <button
            key={track.id}
            onClick={() => playTrack(track)}
            className={`p-4 rounded-xl text-left transition-all ${
              currentTrack?.id === track.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                currentTrack?.id === track.id
                  ? 'bg-white/20'
                  : 'bg-slate-700'
              }`}>
                {currentTrack?.id === track.id && isPlaying ? '⏸' : '▶'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{track.name}</h4>
                <p className={`text-sm ${
                  currentTrack?.id === track.id ? 'text-white/75' : 'text-slate-400'
                }`}>
                  {Math.floor(track.duration / 60)} min • {categories.find(c => c.id === track.category)?.name}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-slate-800/50 rounded-xl p-4">
        <h4 className="font-semibold text-slate-200 mb-2">💡 Dicas</h4>
        <ul className="text-sm text-slate-400 space-y-1">
          <li>• Use fones de ouvido para melhor experiência com áudios binaurais</li>
          <li>• Medite em um local quieto e confortável</li>
          <li>• Comece com sessões curtas de 5-10 minutos</li>
          <li>• Sons da natureza são ótimos para trabalho e estudo</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioSystem;
