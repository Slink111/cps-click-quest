import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TIME_MODES = [1, 5, 10, 30, 60];

interface GameStats {
  clicks: number;
  timeLeft: number;
  cps: number;
  isActive: boolean;
  isFinished: boolean;
  selectedTime: number;
}

interface PersonalBest {
  [key: number]: number;
}

export const CPSTest = () => {
  const [gameStats, setGameStats] = useState<GameStats>({
    clicks: 0,
    timeLeft: 0,
    cps: 0,
    isActive: false,
    isFinished: false,
    selectedTime: 10,
  });

  const [personalBests, setPersonalBests] = useState<PersonalBest>(() => {
    const saved = localStorage.getItem('cps-personal-bests');
    return saved ? JSON.parse(saved) : {};
  });

  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const clickAreaRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    if (gameStats.isActive && gameStats.timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setGameStats(prev => {
          const newTimeLeft = prev.timeLeft - 0.1;
          const newCps = prev.clicks / (prev.selectedTime - newTimeLeft);
          
          if (newTimeLeft <= 0) {
            return {
              ...prev,
              timeLeft: 0,
              cps: prev.clicks / prev.selectedTime,
              isActive: false,
              isFinished: true,
            };
          }
          
          return {
            ...prev,
            timeLeft: newTimeLeft,
            cps: newCps || 0,
          };
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameStats.isActive, gameStats.timeLeft]);

  useEffect(() => {
    if (gameStats.isFinished && gameStats.cps > 0) {
      const currentBest = personalBests[gameStats.selectedTime] || 0;
      if (gameStats.cps > currentBest) {
        const newBests = { ...personalBests, [gameStats.selectedTime]: gameStats.cps };
        setPersonalBests(newBests);
        localStorage.setItem('cps-personal-bests', JSON.stringify(newBests));
      }
    }
  }, [gameStats.isFinished, gameStats.cps, gameStats.selectedTime, personalBests]);

  const startGame = () => {
    setGameStats({
      clicks: 0,
      timeLeft: gameStats.selectedTime,
      cps: 0,
      isActive: true,
      isFinished: false,
      selectedTime: gameStats.selectedTime,
    });
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gameStats.isActive) return;

    const rect = clickAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
      }, 600);
    }

    setGameStats(prev => ({
      ...prev,
      clicks: prev.clicks + 1,
    }));
  };

  const selectTimeMode = (time: number) => {
    if (!gameStats.isActive) {
      setGameStats(prev => ({
        ...prev,
        selectedTime: time,
        isFinished: false,
      }));
    }
  };

  const resetGame = () => {
    setGameStats({
      clicks: 0,
      timeLeft: 0,
      cps: 0,
      isActive: false,
      isFinished: false,
      selectedTime: gameStats.selectedTime,
    });
    setRipples([]);
  };

  const getClickAreaText = () => {
    if (gameStats.isFinished) return "Click to Play Again";
    if (gameStats.isActive) return "CLICK!";
    return "Click to Start";
  };

  const getClickAreaHandler = () => {
    if (gameStats.isFinished || !gameStats.isActive) {
      return startGame;
    }
    return handleClick;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          CPS Test
        </h1>
        <p className="text-lg text-muted-foreground">
          Test your clicking speed and reflexes
        </p>
      </div>

      {/* Time Mode Selection */}
      <Card className="game-card p-6">
        <CardContent className="p-0">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Select Time Mode</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {TIME_MODES.map((time) => (
                <Button
                  key={time}
                  variant={gameStats.selectedTime === time ? "game" : "outline"}
                  onClick={() => selectTimeMode(time)}
                  disabled={gameStats.isActive}
                  className="min-w-[60px]"
                >
                  {time}s
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Game Area */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Stats Display */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="game-card p-4">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-primary">{gameStats.clicks}</div>
              <div className="text-sm text-muted-foreground">Clicks</div>
            </CardContent>
          </Card>
          
          <Card className="game-card p-4">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-accent">
                {gameStats.timeLeft.toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">Time Left</div>
            </CardContent>
          </Card>
          
          <Card className="game-card p-4">
            <CardContent className="p-0 text-center">
              <div className="text-2xl font-bold text-secondary">
                {gameStats.cps.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">CPS</div>
            </CardContent>
          </Card>
        </div>

        {/* Click Area */}
        <div
          ref={clickAreaRef}
          onClick={getClickAreaHandler()}
          className={cn(
            "relative w-full h-64 rounded-xl border-2 border-dashed border-border/50",
            "flex items-center justify-center cursor-pointer transition-all duration-300",
            "hover:border-primary/50 hover:bg-primary/5",
            gameStats.isActive && "border-accent border-solid bg-accent/10 pulse-glow",
            "overflow-hidden"
          )}
        >
          {ripples.map((ripple) => (
            <div
              key={ripple.id}
              className="click-ripple"
              style={{
                left: ripple.x - 20,
                top: ripple.y - 20,
                width: 40,
                height: 40,
              }}
            />
          ))}
          
          <div className="text-center space-y-2 z-10">
            <div className="text-3xl font-bold text-foreground">
              {getClickAreaText()}
            </div>
            {!gameStats.isActive && !gameStats.isFinished && (
              <div className="text-sm text-muted-foreground">
                {gameStats.selectedTime} second test
              </div>
            )}
          </div>
        </div>

        {/* Results & Controls */}
        {gameStats.isFinished && (
          <Card className="game-card p-6">
            <CardContent className="p-0 text-center space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Test Complete!</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-3xl font-bold text-primary">{gameStats.cps.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Your CPS</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary">
                    {personalBests[gameStats.selectedTime]?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-muted-foreground">Personal Best</div>
                </div>
              </div>
              {gameStats.cps > (personalBests[gameStats.selectedTime] || 0) && (
                <div className="text-accent font-semibold">🎉 New Personal Best!</div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {(gameStats.isActive || gameStats.isFinished) && (
          <div className="flex gap-4 justify-center">
            <Button variant="game" onClick={resetGame}>
              Reset
            </Button>
            {gameStats.isFinished && (
              <Button variant="click" onClick={startGame}>
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Personal Bests */}
      {Object.keys(personalBests).length > 0 && (
        <Card className="game-card p-6 w-full max-w-md">
          <CardContent className="p-0">
            <h3 className="text-xl font-semibold text-center mb-4">Personal Bests</h3>
            <div className="space-y-2">
              {TIME_MODES.map((time) => (
                personalBests[time] && (
                  <div key={time} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{time} seconds:</span>
                    <span className="font-bold text-primary">
                      {personalBests[time].toFixed(2)} CPS
                    </span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};