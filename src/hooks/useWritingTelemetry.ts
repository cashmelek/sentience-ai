import { useState, useRef, useCallback } from 'react';
import type { WritingTelemetry, AuthorshipStatus } from '../types/classroom';

export function calculateProcessScore(
  typedCharCount: number,
  pastedCharCount: number,
  deleteCount: number,
  totalTypingTimeMs: number,
  currentLength: number,
  legitimateQuotesCount: number,
  mode: 'text' | 'file'
): { processScore: number; authorshipStatus: AuthorshipStatus; pasteRatio: number } {
  if (mode === 'file') {
    return {
      processScore: 100,
      authorshipStatus: 'file_upload',
      pasteRatio: 0
    };
  }

  const effectiveTotal = Math.max(1, currentLength || typedCharCount + pastedCharCount);
  const pasteRatio = Math.min(1, Math.round((pastedCharCount / effectiveTotal) * 100) / 100);

  let authorshipStatus: AuthorshipStatus = 'verified_organic';
  let processScore = 95;

  if (pasteRatio > 0.85 && deleteCount < 6) {
    authorshipStatus = 'unverified_bulk_paste';
    processScore = Math.max(15, Math.round(35 - pasteRatio * 20));
  } else if (pasteRatio >= 0.25 && legitimateQuotesCount > 0) {
    authorshipStatus = 'mixed_with_citations';
    processScore = Math.min(92, Math.max(75, Math.round(85 + (deleteCount > 15 ? 7 : 0))));
  } else if (pasteRatio > 0.5) {
    authorshipStatus = 'unverified_bulk_paste';
    processScore = Math.max(25, Math.round(50 - pasteRatio * 25));
  } else {
    authorshipStatus = 'verified_organic';
    const organicBonus = Math.min(10, Math.floor(deleteCount / 10));
    processScore = Math.min(100, Math.max(80, Math.round(90 - pasteRatio * 20 + organicBonus)));
  }

  return { processScore, authorshipStatus, pasteRatio };
}

export function useWritingTelemetry() {
  const [typedCharCount, setTypedCharCount] = useState(0);
  const [deleteCount, setDeleteCount] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [pastedCharCount, setPastedCharCount] = useState(0);
  const [legitimateQuotesCount, setLegitimateQuotesCount] = useState(0);

  const totalTypingTimeRef = useRef(0);
  const lastActiveTimestampRef = useRef<number | null>(null);

  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (lastActiveTimestampRef.current !== null) {
      const delta = now - lastActiveTimestampRef.current;
      if (delta > 0 && delta <= 6000) {
        totalTypingTimeRef.current += delta;
      }
    }
    lastActiveTimestampRef.current = now;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    recordActivity();
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setDeleteCount(prev => prev + 1);
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setTypedCharCount(prev => prev + 1);
    }
  }, [recordActivity]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    recordActivity();
    const pastedText = e.clipboardData?.getData('text') || '';
    if (!pastedText) return;

    setPasteCount(prev => prev + 1);
    setPastedCharCount(prev => prev + pastedText.length);

    const isQuoteOrCited =
      (pastedText.length < 600 && (pastedText.startsWith('"') || pastedText.endsWith('"'))) ||
      /\([A-ZÇĞİÖŞÜa-zçğıöşü\s]+,\s*(?:19|20)\d{2}\)/.test(pastedText) ||
      pastedText.length < 350;

    if (isQuoteOrCited) {
      setLegitimateQuotesCount(prev => prev + 1);
    }
  }, [recordActivity]);

  const getTelemetry = useCallback((currentLength: number, mode: 'text' | 'file'): WritingTelemetry => {
    const { processScore, authorshipStatus, pasteRatio } = calculateProcessScore(
      typedCharCount,
      pastedCharCount,
      deleteCount,
      totalTypingTimeRef.current,
      currentLength,
      legitimateQuotesCount,
      mode
    );

    return {
      totalTypingTimeMs: totalTypingTimeRef.current,
      pasteCount,
      pastedCharCount,
      typedCharCount,
      deleteCount,
      pasteRatio,
      processScore,
      authorshipStatus,
      legitimateQuotesCount
    };
  }, [typedCharCount, pastedCharCount, deleteCount, pasteCount, legitimateQuotesCount]);

  return {
    handleKeyDown,
    handlePaste,
    getTelemetry,
    typedCharCount,
    pastedCharCount,
    deleteCount,
    pasteCount,
    legitimateQuotesCount
  };
}
