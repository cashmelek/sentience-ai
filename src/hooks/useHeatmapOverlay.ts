import { useLayoutEffect } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { GrammarSuggestion } from '../services/geminiService';
import type { AuditorResult } from '../types';
import { findGrammarMatch } from '../lib/grammarMatch';

/**
 * B20 Adım 5 (Core Refactor): B16/B18 ısı haritası overlay etkileşimi
 * (editör-katman kaydırma senkronu + insight/gramer/okunabilirlik hover otomatik kaydırma)
 * App.tsx'ten ayrıştırıldı. Davranış birebir korunmuştur.
 */

interface HeatmapOverlayDeps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  backdropRef: RefObject<HTMLDivElement | null>;
  inputText: string;
  showInputHeatmap: boolean;
  auditorResult: AuditorResult | null;
  grammarSuggestions: GrammarSuggestion[];
  hoveredInsight: string | null;
  hoveredGrammar: GrammarSuggestion | null;
  setHoveredInsight: Dispatch<SetStateAction<string | null>>;
  setHoveredGrammar: Dispatch<SetStateAction<GrammarSuggestion | null>>;
  setHoveredReadability: Dispatch<SetStateAction<{ start: number; end: number; text: string } | null>>;
}

export function useHeatmapOverlay(deps: HeatmapOverlayDeps) {
  const {
    textareaRef,
    backdropRef,
    inputText,
    showInputHeatmap,
    auditorResult,
    grammarSuggestions,
    hoveredInsight,
    hoveredGrammar,
    setHoveredInsight,
    setHoveredGrammar,
    setHoveredReadability
  } = deps;

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleInsightHover = (sentence: string) => {
    setHoveredInsight(sentence);
    setTimeout(() => {
      const el = document.getElementById("hovered-insight-span");
      if (el && textareaRef.current) {
        textareaRef.current.scrollTo({
          top: el.offsetTop - 50,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const handleGrammarHover = (suggestion: GrammarSuggestion | null) => {
    setHoveredGrammar(suggestion);
    if (!suggestion) return;
    setTimeout(() => {
      const el = document.getElementById("hovered-grammar-span");
      if (el && textareaRef.current) {
        textareaRef.current.scrollTo({
          top: el.offsetTop - 50,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const handleReadabilityHover = (position: { start: number; end: number; text: string } | null) => {
    setHoveredReadability(position);
    if (!position) return;
    setTimeout(() => {
      const el = document.getElementById("hovered-readability-span");
      if (el && textareaRef.current) {
        textareaRef.current.scrollTo({
          top: el.offsetTop - 50,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  const grammarHoverFound = !!hoveredGrammar && !!findGrammarMatch(inputText, hoveredGrammar.original);

  useLayoutEffect(() => {
    handleScroll();
  }, [inputText, showInputHeatmap, auditorResult, grammarSuggestions, hoveredInsight, hoveredGrammar]);

  return { handleScroll, handleInsightHover, handleGrammarHover, handleReadabilityHover, grammarHoverFound };
}
