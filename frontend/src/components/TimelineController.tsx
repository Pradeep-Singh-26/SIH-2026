import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface TimelineControllerProps {
  timesteps: number[];
  currentTimestep: number;
  onTimestepChange: (t: number) => void;
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  timesteps,
  currentTimestep,
  onTimestepChange
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1x, 2x, 4x

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying || timesteps.length === 0) return;

    const intervalMs = 1800 / playSpeed;
    const timer = setInterval(() => {
      const curIdx = timesteps.indexOf(currentTimestep);
      if (curIdx === -1 || curIdx >= timesteps.length - 1) {
        // Loop or stop
        onTimestepChange(timesteps[0]);
      } else {
        onTimestepChange(timesteps[curIdx + 1]);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, currentTimestep, timesteps, playSpeed, onTimestepChange]);

  const handleStepBack = () => {
    soundEffects.playClickSound();
    const curIdx = timesteps.indexOf(currentTimestep);
    if (curIdx > 0) {
      onTimestepChange(timesteps[curIdx - 1]);
    }
  };

  const handleStepForward = () => {
    soundEffects.playClickSound();
    const curIdx = timesteps.indexOf(currentTimestep);
    if (curIdx < timesteps.length - 1) {
      onTimestepChange(timesteps[curIdx + 1]);
    }
  };

  const handleTogglePlay = () => {
    soundEffects.playClickSound();
    if (!isPlaying) {
      soundEffects.startWaterAmbience();
    } else {
      soundEffects.stopWaterAmbience();
    }
    setIsPlaying(!isPlaying);
  };

  const getReachStatus = (t: number): string => {
    if (t <= 0.5) return 'Initial Dam Breach Toe Inundation (~1.5 km)';
    if (t <= 1.0) return 'Wave passing Yadwad & Bellad Bagewadi (~9 km)';
    if (t <= 2.0) return 'Severe flood surge entering Borgal & Hukkeri valley (~14 km)';
    if (t <= 3.0) return 'Peak flood surge reaching Gokak Falls & Industrial Barrage (~22 km)';
    if (t <= 4.0) return 'Gokak City riverbank district inundated, SH-31 severed (~27 km)';
    if (t <= 6.0) return 'Floodwaters engulfing Konnur and lower floodplain (~35 km)';
    return 'Maximum inundation extent reached across lower Krishna basin reach (~42 km)';
  };

  const curIdx = timesteps.indexOf(currentTimestep);

  return (
    <div className="timeline-bar">
      {/* Play Controls */}
      <div className="play-controls">
        <button className="btn-icon" onClick={handleStepBack} title="Previous Time Step (Arrow Left)">
          <SkipBack size={16} />
        </button>

        <button
          className="btn-icon"
          style={{ width: 44, height: 44, background: 'var(--cyan-primary)', color: '#ffffff', boxShadow: '0 2px 8px var(--cyan-glow)' }}
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pause Simulation' : 'Play Inundation Animation'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
        </button>

        <button className="btn-icon" onClick={handleStepForward} title="Next Time Step (Arrow Right)">
          <SkipForward size={16} />
        </button>

        <button
          className="btn-icon"
          onClick={() => {
            soundEffects.playClickSound();
            setPlaySpeed(playSpeed === 1 ? 2 : playSpeed === 2 ? 4 : 1);
          }}
          title={`Playback Speed: ${playSpeed}x`}
          style={{ fontSize: '0.75rem', fontWeight: 700 }}
        >
          {playSpeed}x
        </button>
      </div>

      {/* Scrubber Slider */}
      <div className="timeline-slider-wrapper">
        <div className="timeline-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: 'var(--cyan-primary)' }}>
            <Clock size={14} />
            <span>Simulation Time: T + {currentTimestep.toFixed(1)} hrs</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
            {getReachStatus(currentTimestep)}
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={Math.max(0, timesteps.length - 1)}
          step="1"
          value={curIdx >= 0 ? curIdx : 0}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            if (timesteps[idx] !== undefined) {
              onTimestepChange(timesteps[idx]);
            }
          }}
          className="timeline-slider"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {timesteps.map((t) => (
            <span
              key={t}
              onClick={() => onTimestepChange(t)}
              style={{
                cursor: 'pointer',
                color: t === currentTimestep ? 'var(--cyan-primary)' : undefined,
                fontWeight: t === currentTimestep ? 700 : 400
              }}
            >
              +{t}h
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
