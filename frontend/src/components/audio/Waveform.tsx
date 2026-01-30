import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
  audioUrl: string;
  onTimeClick?: (time: number) => void;
  onReady?: (duration: number) => void;
  markers?: Array<{ time: number; color?: string }>;
}

export interface WaveformHandle {
  seekTo: (time: number) => void;
  play: () => void;
  pause: () => void;
  getDuration: () => number;
  getCurrentTime: () => number;
}

export const Waveform = forwardRef<WaveformHandle, WaveformProps>(
  ({ audioUrl, onTimeClick, onReady, markers = [] }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (wavesurferRef.current && duration > 0) {
          const progress = Math.min(Math.max(time / duration, 0), 1);
          wavesurferRef.current.seekTo(progress);
          setCurrentTime(time);
        }
      },
      play: () => {
        wavesurferRef.current?.play();
      },
      pause: () => {
        wavesurferRef.current?.pause();
      },
      getDuration: () => duration,
      getCurrentTime: () => wavesurferRef.current?.getCurrentTime() ?? currentTime,
    }));

    useEffect(() => {
      if (!containerRef.current) return;

      const wavesurfer = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#334155',
        progressColor: '#22c55e',
        cursorColor: '#22c55e',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
      });

      wavesurfer.load(audioUrl);

      wavesurfer.on('ready', () => {
        const dur = wavesurfer.getDuration();
        setDuration(dur);
        onReady?.(dur);
      });

      wavesurfer.on('audioprocess', () => {
        setCurrentTime(wavesurfer.getCurrentTime());
      });

      wavesurfer.on('play', () => setIsPlaying(true));
      wavesurfer.on('pause', () => setIsPlaying(false));
      wavesurfer.on('finish', () => setIsPlaying(false));

      wavesurfer.on('click', () => {
        const time = wavesurfer.getCurrentTime();
        onTimeClick?.(time);
      });

      wavesurferRef.current = wavesurfer;

      return () => {
        wavesurfer.destroy();
      };
    }, [audioUrl]);

    const togglePlayPause = () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.playPause();
      }
    };

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="bg-surface border border-border rounded-lg p-4">
        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={togglePlayPause}
            className="p-3 bg-primary rounded-full text-background hover:bg-primary-hover transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <div className="text-sm text-muted">
            <span className="text-text">{formatTime(currentTime)}</span>
            <span className="mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Waveform */}
        <div className="relative">
          <div ref={containerRef} />
          
          {/* Markers */}
          {markers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-0.5"
              style={{
                left: `${(marker.time / duration) * 100}%`,
                backgroundColor: marker.color || '#f59e0b',
              }}
            >
              <div
                className="w-3 h-3 -ml-1 rounded-full"
                style={{ backgroundColor: marker.color || '#f59e0b' }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);

Waveform.displayName = 'Waveform';
