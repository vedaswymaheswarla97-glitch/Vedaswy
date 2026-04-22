import { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 120;

type Point = { x: number; y: number };

const TRACKS = [
  { id: 1, title: 'SEQ_01: CORRUPTION', src: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Retro-synthetic-pop.ogg' },
  { id: 2, title: 'SEQ_02: DATA_LEAK', src: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Synth_pop_beat_with_lead.ogg' },
  { id: 3, title: 'SEQ_03: KERNEL_PANIC', src: 'https://upload.wikimedia.org/wikipedia/commons/9/91/8_Bit_Surf_-_Loop.ogg' },
];

const getRandomFoodPosition = (snake: Point[]): Point => {
  let newFood: Point;
  while (true) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    const isOnSnake = snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    if (!isOnSnake) break;
  }
  return newFood;
};

export default function App() {
  // Game State
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isGamePlaying, setIsGamePlaying] = useState<boolean>(false);
  
  const nextDirectionRef = useRef<Point>({ x: 0, y: -1 });

  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  // Music State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Game
  useEffect(() => {
    setFood(getRandomFoodPosition(snake));
  }, []);

  // Keyboard controls for the game
  // Prevent strict scrolling bugs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && !gameOver) {
        setIsGamePlaying(prev => !prev);
        return;
      }

      if (!isGamePlaying || gameOver) return;

      const currentDir = nextDirectionRef.current;
      switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          if (currentDir.y !== 1) nextDirectionRef.current = { x: 0, y: -1 };
          break;
        case 'arrowdown':
        case 's':
          if (currentDir.y !== -1) nextDirectionRef.current = { x: 0, y: 1 };
          break;
        case 'arrowleft':
        case 'a':
          if (currentDir.x !== 1) nextDirectionRef.current = { x: -1, y: 0 };
          break;
        case 'arrowright':
        case 'd':
          if (currentDir.x !== -1) nextDirectionRef.current = { x: 1, y: 0 };
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGamePlaying, gameOver]);

  // Game Loop
  useEffect(() => {
    if (!isGamePlaying || gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const dir = nextDirectionRef.current;
        setDirection(dir);

        const newHead = { x: head.x + dir.x, y: head.y + dir.y };

        // Check Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          setGameOver(true);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];
        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, Math.max(INITIAL_SPEED - score * 2, 40));
    return () => clearInterval(intervalId);
  }, [isGamePlaying, gameOver, score]);

  // Check for food consumption
  useEffect(() => {
    if (gameOver) return;
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 10);
      setFood(getRandomFoodPosition(snake));
    } else if (snake.length > 1 + score / 10) {
       setSnake(s => s.slice(0, s.length - 1));
    }
  }, [snake, food, score, gameOver]);
  
  // Music Handlers
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
  }, [currentTrackIndex]);

  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: -1 });
    nextDirectionRef.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setIsGamePlaying(true);
    setFood(getRandomFoodPosition([{ x: 10, y: 10 }]));
  };

  return (
    <div className="w-full h-[100dvh] bg-black text-[#0ff] flex overflow-hidden font-mono relative screen-tear">
      <div className="static-noise"></div>
      <div className="scanlines"></div>

      {/* Left Sidebar - Data Node */}
      <aside className="w-80 bg-black border-r-4 border-[#f0f] flex flex-col z-10 flex-shrink-0 p-6">
        <div className="mb-10 border-jarring p-4 relative bg-[#0ff]/10">
          <div className="absolute -top-3 -left-3 bg-[#f0f] text-black px-2 py-0.5 text-xs font-bold">NODE_STATUS</div>
          <h1 className="text-3xl font-black uppercase text-[#fff] glitch-text mt-2" data-text="OS: OROBOROS">OS: OROBOROS</h1>
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-4 h-4 bg-[#0ff] ${isPlaying ? 'animate-pulse' : ''}`}></div>
            <span className="text-sm">LINK_ACTIVE</span>
          </div>
        </div>
        
        <div className="border-jarring p-4 flex flex-col items-center justify-center relative group">
          <div className="absolute inset-0 bg-[#f0f] opacity-10"></div>
          {isPlaying ? (
            <div className="w-32 h-32 border-4 border-[#0ff] bg-black flex items-center justify-center">
              <Play size={64} className="text-[#f0f] animate-pulse ml-2" fill="currentColor" />
            </div>
          ) : (
            <div className="w-32 h-32 border-4 border-[#f0f] bg-black flex items-center justify-center opacity-50">
              <Pause size={64} className="text-[#0ff]" fill="currentColor" />
            </div>
          )}
          <div className="mt-6 w-full text-center">
            <h2 className="text-xl font-bold truncate text-[#fff] bg-[#f0f] px-2 py-1 inline-block">{TRACKS[currentTrackIndex].title}</h2>
            <p className="text-sm text-[#0ff] mt-2 tracking-widest border-b-2 border-[#0ff] pb-1">OVERRIDE // {currentTrackIndex + 1}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-6">
          <div className="h-4 border-2 border-[#0ff] w-full relative bg-black">
            <div className={`absolute top-0 left-0 h-full bg-[#f0f] w-[100%] ${isPlaying ? 'animate-pulse' : 'opacity-30'}`}></div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={prevTrack} className="p-2 border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-black transition-none cursor-pointer">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              className="p-4 border-2 border-[#f0f] text-[#f0f] bg-black hover:bg-[#f0f] hover:text-black transition-none scale-110 cursor-pointer"
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={nextTrack} className="p-2 border-2 border-[#0ff] text-[#0ff] hover:bg-[#0ff] hover:text-black transition-none cursor-pointer">
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="mt-auto border-t-4 border-[#f0f] pt-6 flex items-center gap-4 text-sm">
          <button onClick={toggleMute} className="h-10 w-10 border-2 border-[#0ff] flex items-center justify-center hover:bg-[#0ff] hover:text-black cursor-pointer">
            {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <div className="flex-1 h-8 border-2 border-[#0ff] flex items-center px-1 bg-black">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="w-full h-full appearance-none cursor-pointer bg-transparent focus:outline-none"
              style={{
                background: `linear-gradient(to right, #f0f 0%, #f0f ${volume * 100}%, transparent ${volume * 100}%, transparent 100%)`
              }}
            />
          </div>
        </div>
      </aside>

      {/* Center - Game Interface */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative overflow-y-auto">
        <div className="mb-6 flex justify-between w-full max-w-[600px] border-jarring p-4 bg-black">
          <div>
            <span className="text-sm text-[#f0f] block mb-1">CYCLE_HASH</span>
            <div className="text-4xl text-[#0ff]">
              {score.toString().padStart(6, '0')}
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm text-[#f0f] block mb-1">PEAK_MEMORY</span>
            <div className="text-3xl text-white opacity-80">
              {highScore.toString().padStart(6, '0')}
            </div>
          </div>
        </div>

        <div className="relative border-jarring w-full max-w-[600px] aspect-square flex-shrink-0 bg-black">
          <div 
            className="w-full h-full relative overflow-hidden grid"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            }}
          >
            {/* Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none" 
              style={{
                backgroundImage: 'linear-gradient(#0ff 1px, transparent 1px), linear-gradient(90deg, #0ff 1px, transparent 1px)',
                backgroundSize: `${100/GRID_SIZE}% ${100/GRID_SIZE}%`
              }}
            ></div>
            
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              
              const isSnakeHead = snake[0].x === x && snake[0].y === y;
              const isSnakeBody = snake.some((segment, idx) => idx !== 0 && segment.x === x && segment.y === y);
              const isFood = food.x === x && food.y === y;

              let cellClasses = "w-full h-full relative z-10 ";
              if (isSnakeHead) {
                cellClasses += "bg-[#f0f] border-2 border-white scale-110 z-20 ";
              } else if (isSnakeBody) {
                cellClasses += "bg-[#0ff] border border-black ";
              } else if (isFood) {
                cellClasses += "bg-white animate-pulse border-2 border-[#f0f] ";
              }

              return <div key={i} className={cellClasses} />;
            })}

            {!isGamePlaying && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none bg-black/80 backdrop-blur-sm">
                 <button 
                  onClick={() => setIsGamePlaying(true)}
                  className="px-8 py-6 text-2xl border-4 text-[#fff] font-bold uppercase pointer-events-auto glitch-panel bg-[#f0f] cursor-pointer shadow-[0_0_20px_#f0f]"
                >
                  EXECUTE_ROUTINE()
                </button>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none bg-[#f0f]/20">
                <div className="bg-black border-jarring p-8 flex flex-col items-center justify-center pointer-events-auto shadow-[0_0_50px_#f0f]">
                  <AlertTriangle className="text-[#f0f] w-16 h-16 mb-4 animate-ping" />
                  <h2 className="text-4xl font-bold mb-6 text-white bg-[#f0f] px-4 py-2">KERNEL PANIC</h2>
                  <p className="mb-8 text-xl text-[#0ff]">DATA DUMP: {score}</p>
                  <button 
                    onClick={restartGame}
                    className="flex items-center gap-4 px-8 py-4 text-xl border-4 border-[#0ff] text-[#0ff] font-bold hover:bg-[#0ff] hover:text-black transition-none uppercase cursor-pointer"
                  >
                    RESTORE_STATE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 flex flex-wrap justify-center gap-6 border-2 border-[#f0f] p-4 bg-black w-full max-w-[600px]">
           <div className="flex items-center gap-2 text-sm text-[#0ff]">
              <span className="bg-[#f0f] text-black px-2 py-1 font-bold">W A S D</span>
              <span className="uppercase">Navigate Mesh</span>
           </div>
           <div className="w-1 bg-[#0ff]"></div>
           <div className="flex items-center gap-2 text-sm text-[#0ff]">
             <span className="bg-[#f0f] text-black px-2 py-1 font-bold">SPACE</span>
             <span className="uppercase">Halt Execution</span>
           </div>
        </div>
      </main>

      {/* Right Sidebar - Queue Data */}
      <aside className="w-80 bg-black border-l-4 border-[#0ff] p-6 z-10 flex flex-col hidden xl:flex flex-shrink-0">
        <div className="mb-8 border-jarring p-4 bg-[#f0f]/10">
          <h3 className="text-xl font-bold text-[#f0f] mb-6 border-b-4 border-[#f0f] pb-2">AUDIO_STACK</h3>
          <div className="space-y-4">
            {TRACKS.map((track, i) => {
              const isPlayingNow = i === currentTrackIndex;
              return (
                <div 
                  key={track.id}
                  onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                  className={`flex items-center gap-4 p-3 border-2 cursor-pointer transition-none ${isPlayingNow ? 'border-[#0ff] bg-[#0ff] text-black' : 'border-[#444] text-[#888] hover:border-[#f0f] hover:text-[#f0f]'}`}
                >
                  <div className={`text-xl font-bold ${isPlayingNow ? 'animate-pulse' : ''}`}>
                    {isPlayingNow && isPlaying ? '>' : '-'}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-lg font-bold truncate`}>{track.title}</p>
                    <p className="text-sm uppercase opacity-70">SIZE: {(Math.random() * 10 + 2).toFixed(2)} MB</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-jarring p-4 bg-black relative">
          <div className="absolute -top-3 -right-3 bg-[#0ff] text-black px-2 py-0.5 text-xs font-bold">LOG</div>
          <p className="text-[#f0f] font-bold uppercase mb-2">ERR_OVERRIDE</p>
          <p className="text-sm leading-relaxed text-white">
            WARNING: NEURAL LINK DETACHED. AUDIO SYNC MAXIMIZED. AVOID WALL BOUNDARIES TO PREVENT CORRUPTION.
          </p>
        </div>
      </aside>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        src={TRACKS[currentTrackIndex].src} 
        onEnded={nextTrack}
        loop={false}
      />
    </div>
  );
}
