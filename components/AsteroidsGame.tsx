import React, { useRef, useEffect, useState } from 'react';
import { useAsteroidsGame } from '../hooks/useAsteroidsGame';
import { GameStatus } from '../types';
import { Play, RotateCcw, Trophy, Heart } from 'lucide-react';

const AsteroidsGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { uiState, initGame } = useAsteroidsGame(canvasRef);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
        // Note: resizing canvas clears it, the game loop redraws immediately.
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
        canvasRef.current.width = dimensions.width;
        canvasRef.current.height = dimensions.height;
    }
  }, [dimensions]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Game Canvas */}
      <canvas 
        ref={canvasRef} 
        className="block absolute inset-0 z-0 cursor-none"
      />
      
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDAsIDI1NSwgMCwgMC4wNSkiLz4KPC9zdmc+')] opacity-50"></div>
      
      {/* CRT Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-radial-gradient-vignette"></div>

      {/* HUD */}
      {uiState.status !== GameStatus.MENU && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 font-['Press_Start_2P'] text-[#00ff00] text-shadow-glow">
          <div className="flex flex-col gap-2">
            <div className="text-xl tracking-widest">SCORE: {uiState.score}</div>
            <div className="text-xs opacity-70">LEVEL {uiState.level}</div>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: Math.max(0, uiState.lives) }).map((_, i) => (
              <Heart key={i} className="w-6 h-6 fill-current text-[#00ff00]" />
            ))}
          </div>
        </div>
      )}

      {/* Main Menu */}
      {uiState.status === GameStatus.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/70 backdrop-blur-sm">
          <h1 className="text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-[#00ff00] to-[#004400] font-['Press_Start_2P'] mb-8 drop-shadow-[0_0_10px_rgba(0,255,0,0.8)] text-center px-4">
            ASTEROIDS
          </h1>
          <button 
            onClick={initGame}
            className="group relative px-8 py-4 bg-transparent border-4 border-[#00ff00] text-[#00ff00] font-['Press_Start_2P'] text-xl hover:bg-[#00ff00] hover:text-black transition-all duration-200 flex items-center gap-3 uppercase tracking-wider"
          >
            <Play className="w-6 h-6" />
            Start Game
            {/* Button Glow Effect */}
            <div className="absolute inset-0 bg-[#00ff00] blur-xl opacity-0 group-hover:opacity-40 transition-opacity"></div>
          </button>
          
          <div className="mt-12 text-[#00ff00]/60 text-sm font-['Press_Start_2P'] text-center leading-loose">
            <p>CONTROLS</p>
            <p>Arrow Up : THRUST</p>
            <p>Arrow Left/Right : ROTATE</p>
            <p>Space : FIRE</p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {uiState.status === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/80 backdrop-blur-md">
           <h2 className="text-6xl text-[#ff3333] font-['Press_Start_2P'] mb-6 drop-shadow-[0_0_15px_rgba(255,51,51,0.8)]">GAME OVER</h2>
           
           <div className="flex flex-col items-center gap-4 mb-10 text-[#00ff00] font-['Press_Start_2P']">
             <div className="flex items-center gap-2 text-2xl">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <span>FINAL SCORE: {uiState.score}</span>
             </div>
             <div className="text-sm opacity-70">LEVEL REACHED: {uiState.level}</div>
           </div>

           <button 
            onClick={initGame}
            className="group px-8 py-4 bg-transparent border-2 border-[#00ff00] text-[#00ff00] font-['Press_Start_2P'] hover:bg-[#00ff00] hover:text-black transition-all duration-200 flex items-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            TRY AGAIN
          </button>
        </div>
      )}
      
      {/* CSS Tricks for CRT effects injected directly or via style tag in Index */}
      <style>{`
        .bg-radial-gradient-vignette {
          background: radial-gradient(circle, rgba(0,0,0,0) 60%, rgba(0,0,0,0.6) 100%);
        }
        .text-shadow-glow {
          text-shadow: 0 0 5px rgba(0, 255, 0, 0.7);
        }
      `}</style>
    </div>
  );
};

export default AsteroidsGame;
