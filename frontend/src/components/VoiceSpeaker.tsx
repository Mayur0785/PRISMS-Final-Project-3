import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface VoiceSpeakerProps {
  text: string;
  lang?: 'en' | 'mr' | 'hi';
  label?: string;
}

export const VoiceSpeaker: React.FC<VoiceSpeakerProps> = ({ text, lang = 'en', label }) => {
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
    }
  }, []);

  const handleSpeak = () => {
    if (!supported || typeof window === 'undefined') return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop active playback

    const utterance = new SpeechSynthesisUtterance(text);
    if (lang === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!supported) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
        <VolumeX className="w-3 h-3 text-slate-400" />
        Speech playback unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 ${
        speaking
          ? 'bg-amber-500 text-slate-950 animate-pulse'
          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
      }`}
      title="Listen to audio explanation"
    >
      <Volume2 className={`w-3.5 h-3.5 ${speaking ? 'animate-bounce' : ''}`} />
      <span>{label || (speaking ? 'Speaking...' : lang === 'mr' ? 'ऐका' : 'Listen')}</span>
    </button>
  );
};
