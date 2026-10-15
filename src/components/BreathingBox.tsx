import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine, type BreathingPhase } from '../utils/SoundEngine';
import type { TranslationKey } from '../i18n';

interface BreathingBoxProps {
  t: TranslationKey['breathing'];
  langCode: string;
}

type Phase = 'READY' | 'INHALE' | 'HOLD_IN' | 'EXHALE' | 'HOLD_OUT';

const PHASES: Phase[] = ['INHALE', 'HOLD_IN', 'EXHALE', 'HOLD_OUT'];

export const BreathingBox: React.FC<BreathingBoxProps> = ({ t }) => {
  // Pacing options (seconds per phase)
  const pacingOptions = [
    { sec: 3, label: t.pace3s, short: '3s' },
    { sec: 4, label: t.pace4s, short: '4s' },
    { sec: 5, label: t.pace5s, short: '5s' },
    { sec: 6, label: t.pace6s, short: '6s' },
  ];

  // State
  const [duration, setDuration] = useState<number>(4);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('READY');
  const [phaseProgress, setPhaseProgress] = useState<number>(0); // 0 to 1
  const [countdown, setCountdown] = useState<number>(4);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [sessionMinutes, setSessionMinutes] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Animation frame and timing refs
  const animFrameRef = useRef<number | null>(null);
  const phaseStartTimeRef = useRef<number>(0);
  const pausedTimeElapsedRef = useRef<number>(0);
  const currentPhaseRef = useRef<Phase>('READY');
  const durationRef = useRef<number>(4);
  const isActiveRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  // Sync refs with state
  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Load saved preferences on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedDuration = localStorage.getItem('box_breathe_pace');
      if (savedDuration) {
        const val = parseInt(savedDuration, 10);
        if ([3, 4, 5, 6].includes(val)) {
          setDuration(val);
          setCountdown(val);
        }
      }

      const savedMute = localStorage.getItem('box_breathe_muted');
      if (savedMute !== null) {
        const muted = savedMute === 'true';
        setIsMuted(muted);
        soundEngine.setMuted(muted);
      }

      const savedCycles = localStorage.getItem('box_breathe_cycles');
      if (savedCycles) {
        const cyc = parseInt(savedCycles, 10);
        if (!isNaN(cyc)) setCompletedCycles(cyc);
      }

      const savedMins = localStorage.getItem('box_breathe_minutes');
      if (savedMins) {
        const mins = parseFloat(savedMins);
        if (!isNaN(mins)) setSessionMinutes(mins);
      }
    } catch {
      // LocalStorage fallback
    }
  }, []);

  // Update localStorage when stats or preferences change
  const saveStats = (cycles: number, minutes: number) => {
    try {
      localStorage.setItem('box_breathe_cycles', cycles.toString());
      localStorage.setItem('box_breathe_minutes', minutes.toFixed(1));
    } catch {
      // Silently ignore
    }
  };

  // Phase transition handler
  const transitionToPhase = useCallback((nextPhase: Phase) => {
    setCurrentPhase(nextPhase);
    currentPhaseRef.current = nextPhase;
    phaseStartTimeRef.current = performance.now();
    pausedTimeElapsedRef.current = 0;
    setPhaseProgress(0);
    setCountdown(durationRef.current);

    // Audio cue
    if (nextPhase !== 'READY') {
      soundEngine.playPhaseCue(nextPhase as BreathingPhase);
    }
  }, []);

  // Complete a full 4-4-4-4 cycle
  const completeCycle = useCallback(() => {
    setCompletedCycles((prev) => {
      const next = prev + 1;
      const addedMinutes = (durationRef.current * 4) / 60;
      setSessionMinutes((prevMin) => {
        const nextMin = prevMin + addedMinutes;
        saveStats(next, nextMin);
        return nextMin;
      });
      return next;
    });

    // Play subtle achievement cue
    soundEngine.playPhaseCue('COMPLETE');
  }, []);

  // Core high-precision animation loop
  const updateTick = useCallback((now: number) => {
    if (!isActiveRef.current || isPausedRef.current) {
      return;
    }

    const elapsedMs = now - phaseStartTimeRef.current;
    const phaseTotalMs = durationRef.current * 1000;
    const progress = Math.min(elapsedMs / phaseTotalMs, 1);
    setPhaseProgress(progress);

    // Calculate countdown number (e.g. 4, 3, 2, 1)
    const remainingSec = Math.max(1, Math.ceil((phaseTotalMs - elapsedMs) / 1000));
    setCountdown(remainingSec);

    if (elapsedMs >= phaseTotalMs) {
      const curr = currentPhaseRef.current;
      const currIndex = PHASES.indexOf(curr);
      if (currIndex === -1 || currIndex === PHASES.length - 1) {
        completeCycle();
        transitionToPhase('INHALE');
      } else {
        const nextPhase = PHASES[currIndex + 1];
        transitionToPhase(nextPhase);
      }
    }

    animFrameRef.current = requestAnimationFrame(updateTick);
  }, [completeCycle, transitionToPhase]);

  // Start breathing session
  const startBreathing = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    isActiveRef.current = true;
    isPausedRef.current = false;
    transitionToPhase('INHALE');
    animFrameRef.current = requestAnimationFrame(updateTick);
  }, [transitionToPhase, updateTick]);

  // Pause breathing
  const pauseBreathing = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    pausedTimeElapsedRef.current = performance.now() - phaseStartTimeRef.current;
    soundEngine.stopBreathSounds();
  }, []);

  // Resume breathing
  const resumeBreathing = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    phaseStartTimeRef.current = performance.now() - pausedTimeElapsedRef.current;
    animFrameRef.current = requestAnimationFrame(updateTick);
  }, [updateTick]);

  // Reset breathing session
  const resetSession = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    isActiveRef.current = false;
    isPausedRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    soundEngine.stopBreathSounds();
    setCurrentPhase('READY');
    setPhaseProgress(0);
    setCountdown(durationRef.current);
  }, []);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      try {
        localStorage.setItem('box_breathe_muted', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  // Select pacing duration
  const handleSelectDuration = (newSec: number) => {
    setDuration(newSec);
    durationRef.current = newSec;
    try {
      localStorage.setItem('box_breathe_pace', newSec.toString());
    } catch {
      // Ignore
    }

    if (!isActive) {
      setCountdown(newSec);
    }
  };

  // Reset stats
  const handleResetStats = () => {
    setCompletedCycles(0);
    setSessionMinutes(0);
    saveStats(0, 0);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isActive) {
          startBreathing();
        } else if (isPaused) {
          resumeBreathing();
        } else {
          pauseBreathing();
        }
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        resetSession();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isPaused, startBreathing, pauseBreathing, resumeBreathing, handleToggleMute, resetSession]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      soundEngine.stopBreathSounds();
    };
  }, []);

  // Dynamic Scale
  let scale = 0.85;
  if (currentPhase === 'READY') {
    scale = 0.85;
  } else if (currentPhase === 'INHALE') {
    scale = 0.76 + 0.24 * phaseProgress;
  } else if (currentPhase === 'HOLD_IN') {
    scale = 1.0 + 0.02 * Math.sin(phaseProgress * Math.PI);
  } else if (currentPhase === 'EXHALE') {
    scale = 1.0 - 0.24 * phaseProgress;
  } else if (currentPhase === 'HOLD_OUT') {
    scale = 0.76;
  }

  // Active side perimeter progress
  const isTopActive = currentPhase === 'INHALE';
  const isRightActive = currentPhase === 'HOLD_IN';
  const isBottomActive = currentPhase === 'EXHALE';
  const isLeftActive = currentPhase === 'HOLD_OUT';

  const topProgress = isTopActive ? phaseProgress : currentPhase !== 'READY' ? 1 : 0;
  const rightProgress = isRightActive ? phaseProgress : ['EXHALE', 'HOLD_OUT'].includes(currentPhase) ? 1 : 0;
  const bottomProgress = isBottomActive ? phaseProgress : currentPhase === 'HOLD_OUT' ? 1 : 0;
  const leftProgress = isLeftActive ? phaseProgress : 0;

  // Phase Prompts and Titles
  const getPhaseTitle = (): string => {
    switch (currentPhase) {
      case 'INHALE':
        return t.inhale;
      case 'HOLD_IN':
        return t.holdIn;
      case 'EXHALE':
        return t.exhale;
      case 'HOLD_OUT':
        return t.holdOut;
      default:
        return isPaused ? t.paused : t.ready;
    }
  };

  const getPhaseDescription = (): string => {
    if (isPaused) return t.promptPaused;
    switch (currentPhase) {
      case 'INHALE':
        return t.promptInhale;
      case 'HOLD_IN':
        return t.promptHoldIn;
      case 'EXHALE':
        return t.promptExhale;
      case 'HOLD_OUT':
        return t.promptHoldOut;
      default:
        return t.promptReady;
    }
  };

  // Tracer coordinates for the glowing comet head along the box perimeter (viewBox 0 0 280 280)
  const boxX = 24;
  const boxY = 24;
  const boxSize = 232;

  let tracerX = boxX;
  let tracerY = boxY;
  let tracerVisible = currentPhase !== 'READY' && !isPaused;

  if (isTopActive) {
    tracerX = boxX + boxSize * phaseProgress;
    tracerY = boxY;
  } else if (isRightActive) {
    tracerX = boxX + boxSize;
    tracerY = boxY + boxSize * phaseProgress;
  } else if (isBottomActive) {
    tracerX = boxX + boxSize * (1 - phaseProgress);
    tracerY = boxY + boxSize;
  } else if (isLeftActive) {
    tracerX = boxX;
    tracerY = boxY + boxSize * (1 - phaseProgress);
  } else {
    tracerVisible = false;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto px-2 sm:px-4 select-none">
      {/* Visual Breathing Box Container - Optimized for mobile viewports */}
      <div className="relative flex items-center justify-center w-[260px] h-[260px] xs:w-[285px] xs:h-[285px] sm:w-[350px] sm:h-[350px] md:w-[390px] md:h-[390px] my-2 sm:my-5">
        {/* Calming Radial Ambient Glow Aura with palette colors (#03684A, #15D59C, #66E1BC) */}
        <div
          className={`absolute inset-0 rounded-3xl transition-opacity duration-1000 blur-2xl pointer-events-none ${
            currentPhase === 'INHALE' || currentPhase === 'HOLD_IN'
              ? 'bg-gradient-to-tr from-[#03684A]/30 via-[#15D59C]/35 to-[#66E1BC]/30 opacity-100 dark:from-[#03684A]/40 dark:via-[#15D59C]/40 dark:to-[#66E1BC]/30'
              : currentPhase === 'EXHALE' || currentPhase === 'HOLD_OUT'
              ? 'bg-gradient-to-tr from-[#03684A]/15 via-[#66E1BC]/15 to-slate-400/10 opacity-70 dark:from-[#03684A]/25 dark:via-[#15D59C]/15 dark:to-transparent'
              : 'bg-[#15D59C]/10 dark:bg-[#15D59C]/15 opacity-40'
          }`}
          style={{
            transform: `scale(${scale * 1.08})`,
            transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />

        {/* Dynamic Expanding/Contracting Breathing Square */}
        <div
          className="relative flex flex-col items-center justify-center w-[84%] h-[84%] rounded-3xl glass-panel shadow-xl dark:shadow-glow-dark border border-[#66E1BC]/40 dark:border-[#1A3830] transition-all overflow-hidden"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        >
          {/* Background gradient reflection using #E5F6F1 */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              currentPhase === 'INHALE' || currentPhase === 'HOLD_IN'
                ? 'bg-gradient-to-br from-[#E5F6F1]/90 via-transparent to-[#66E1BC]/20 dark:from-[#03684A]/20 dark:to-transparent opacity-100'
                : 'bg-transparent opacity-0'
            }`}
          />

          {/* Center Content: Phase Name & Dynamic Countdown */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-3">
            {/* Localized Phase Badge */}
            <span
              className={`text-[11px] sm:text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full transition-colors duration-300 shadow-sm ${
                currentPhase === 'READY'
                  ? 'bg-[#E5F6F1] text-[#03684A] dark:bg-[#10221D] dark:text-[#66E1BC] border border-[#66E1BC]/30'
                  : currentPhase === 'INHALE'
                  ? 'bg-[#E5F6F1] text-[#03684A] dark:bg-[#03684A]/80 dark:text-[#E5F6F1] border border-[#15D59C]/50'
                  : currentPhase === 'HOLD_IN'
                  ? 'bg-[#66E1BC]/25 text-[#03684A] dark:bg-[#15D59C]/25 dark:text-[#66E1BC] border border-[#66E1BC]/60'
                  : currentPhase === 'EXHALE'
                  ? 'bg-[#E5F6F1] text-[#03684A] dark:bg-[#03684A]/70 dark:text-[#E5F6F1] border border-[#15D59C]/40'
                  : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {getPhaseTitle()}
            </span>

            {/* Countdown Display */}
            <div className="my-1 sm:my-2.5">
              <span className="text-5xl sm:text-7xl font-extralight tracking-tight text-[#03684A] dark:text-white tabular-nums drop-shadow-sm transition-transform duration-200 inline-block">
                {currentPhase === 'READY' ? duration : countdown}
              </span>
            </div>

            {/* Micro Cycle Counter */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-[#15D59C] dark:bg-[#15D59C] shadow-sm"></span>
              <span>
                {t.cycle} {isActive ? completedCycles + 1 : completedCycles}
              </span>
            </div>
          </div>
        </div>

        {/* SVG Perimeter Progress Borders & Flowing Comet Tracer */}
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        >
          {/* Background perimeter guide track */}
          <rect
            x={boxX}
            y={boxY}
            width={boxSize}
            height={boxSize}
            rx="18"
            ry="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            className="text-[#E5F6F1] dark:text-[#1A3830]"
          />

          {/* 1. Top Edge: Inhale (#15D59C) */}
          <line
            x1={boxX}
            y1={boxY}
            x2={boxX + boxSize * topProgress}
            y2={boxY}
            strokeWidth="5"
            strokeLinecap="round"
            className={`transition-colors duration-200 ${
              isTopActive
                ? 'stroke-[#15D59C]'
                : topProgress > 0
                ? 'stroke-[#15D59C]/40'
                : 'stroke-transparent'
            }`}
          />

          {/* 2. Right Edge: Hold In (#66E1BC) */}
          <line
            x1={boxX + boxSize}
            y1={boxY}
            x2={boxX + boxSize}
            y2={boxY + boxSize * rightProgress}
            strokeWidth="5"
            strokeLinecap="round"
            className={`transition-colors duration-200 ${
              isRightActive
                ? 'stroke-[#66E1BC]'
                : rightProgress > 0
                ? 'stroke-[#66E1BC]/40'
                : 'stroke-transparent'
            }`}
          />

          {/* 3. Bottom Edge: Exhale (#15D59C) */}
          <line
            x1={boxX + boxSize}
            y1={boxY + boxSize}
            x2={boxX + boxSize * (1 - bottomProgress)}
            y2={boxY + boxSize}
            strokeWidth="5"
            strokeLinecap="round"
            className={`transition-colors duration-200 ${
              isBottomActive
                ? 'stroke-[#15D59C]'
                : bottomProgress > 0
                ? 'stroke-[#15D59C]/40'
                : 'stroke-transparent'
            }`}
          />

          {/* 4. Left Edge: Hold Out (#66E1BC) */}
          <line
            x1={boxX}
            y1={boxY + boxSize}
            x2={boxX}
            y2={boxY + boxSize * (1 - leftProgress)}
            strokeWidth="5"
            strokeLinecap="round"
            className={`transition-colors duration-200 ${
              isLeftActive
                ? 'stroke-[#66E1BC]'
                : leftProgress > 0
                ? 'stroke-[#66E1BC]/40'
                : 'stroke-transparent'
            }`}
          />

          {/* Glowing Comet Head Tracer */}
          {tracerVisible && (
            <g transform={`translate(${tracerX}, ${tracerY})`}>
              <circle
                r="10"
                className="fill-[#66E1BC]/50 dark:fill-[#15D59C]/40 animate-ping opacity-75"
              />
              <circle
                r="6.5"
                className="fill-[#15D59C] shadow-md"
              />
              <circle r="2.5" className="fill-white" />
            </g>
          )}
        </svg>
      </div>

      {/* Dynamic Breath Instruction Prompt */}
      <div className="w-full text-center px-2 min-h-[36px] sm:min-h-[42px] flex items-center justify-center">
        <p className="text-xs sm:text-base font-normal text-slate-700 dark:text-slate-300 transition-all duration-300">
          {getPhaseDescription()}
        </p>
      </div>

      {/* Primary Action Controls: Thumb-Friendly on Mobile */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 mt-3 sm:mt-4 w-full">
        {/* Start / Pause / Resume Button */}
        {!isActive ? (
          <button
            onClick={startBreathing}
            className="flex-1 max-w-[170px] sm:max-w-[200px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base text-white bg-[#03684A] hover:bg-[#02523A] active:scale-[0.98] transition-all shadow-md hover:shadow-glow-mint focus:outline-none"
            aria-label={t.start}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{t.start}</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={resumeBreathing}
            className="flex-1 max-w-[170px] sm:max-w-[200px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base text-white bg-[#03684A] hover:bg-[#02523A] active:scale-[0.98] transition-all shadow-md hover:shadow-glow-mint focus:outline-none"
            aria-label={t.resume}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>{t.resume}</span>
          </button>
        ) : (
          <button
            onClick={pauseBreathing}
            className="flex-1 max-w-[170px] sm:max-w-[200px] inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-semibold text-sm sm:text-base text-slate-700 dark:text-slate-200 bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] transition-all focus:outline-none"
            aria-label={t.pause}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 fill-current"
              viewBox="0 0 24 24"
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            <span>{t.pause}</span>
          </button>
        )}

        {/* Reset Button */}
        {isActive && (
          <button
            onClick={resetSession}
            className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-500 hover:text-[#03684A] dark:text-slate-400 dark:hover:text-[#15D59C] bg-[#E5F6F1]/80 hover:bg-[#E5F6F1] dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 transition-all focus:outline-none"
            title={t.reset}
            aria-label={t.reset}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 stroke-current"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}

        {/* Mute / Unmute Button */}
        <button
          onClick={handleToggleMute}
          className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full active:scale-95 transition-all focus:outline-none ${
            isMuted
              ? 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
              : 'text-[#03684A] dark:text-[#15D59C] bg-[#E5F6F1] dark:bg-[#10221D] hover:bg-[#d8f2eb] border border-[#66E1BC]/40'
          }`}
          title={isMuted ? t.unmute : t.mute}
          aria-label={isMuted ? t.unmute : t.mute}
        >
          {isMuted ? (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Pacing Quick-Select Pills (3s, 4s, 5s, 6s) - Fully responsive on mobile */}
      <div className="mt-4 sm:mt-5 flex flex-col items-center w-full">
        <label className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
          {t.durationLabel}
        </label>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-[#E5F6F1]/60 dark:bg-[#10221D] border border-[#66E1BC]/30 dark:border-[#1A3830] w-full max-w-sm sm:max-w-none">
          {pacingOptions.map((opt) => (
            <button
              key={opt.sec}
              onClick={() => handleSelectDuration(opt.sec)}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-center ${
                duration === opt.sec
                  ? 'bg-white dark:bg-[#1F3831] text-[#03684A] dark:text-[#15D59C] shadow-sm font-bold border border-[#15D59C]/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#03684A] dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mindful Session Stats & LocalStorage Counter */}
      {isMounted && (
        <div className="mt-4 sm:mt-5 w-full max-w-xs sm:max-w-md p-2.5 sm:p-3.5 rounded-2xl glass-panel border border-[#66E1BC]/30 dark:border-[#1A3830] flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="block text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium">
                {t.cyclesCompleted}
              </span>
              <span className="font-bold text-[#03684A] dark:text-[#15D59C] tabular-nums text-sm sm:text-base">
                {completedCycles}
              </span>
            </div>
            <div className="h-6 sm:h-7 w-[1px] bg-[#66E1BC]/40 dark:bg-[#1A3830]"></div>
            <div>
              <span className="block text-slate-400 text-[10px] sm:text-[11px] uppercase tracking-wider font-medium">
                {t.mindfulMinutes}
              </span>
              <span className="font-bold text-[#03684A] dark:text-[#15D59C] tabular-nums text-sm sm:text-base">
                {sessionMinutes.toFixed(1)}m
              </span>
            </div>
          </div>

          {(completedCycles > 0 || sessionMinutes > 0) && (
            <button
              onClick={handleResetStats}
              className="text-[11px] sm:text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded"
              title={t.resetStats}
            >
              {t.resetStats}
            </button>
          )}
        </div>
      )}

      {/* Subtle Keyboard Shortcut Tip & Audio Engine Note */}
      <div className="mt-3 text-center">
        <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">
          {t.keyboardTip}
        </p>
      </div>
    </div>
  );
};
