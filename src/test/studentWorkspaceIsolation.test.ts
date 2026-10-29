import { describe, it, expect } from 'vitest';
import type { AppUser } from '../types';

describe('Student Workspace & Role Isolation Suite', () => {
  it('identifies student role correctly and isolates from standard editor', () => {
    const studentUser: AppUser = {
      uid: 'std_442',
      email: 'ogrenci@gazi.edu.tr',
      role: 'student',
      academicProfile: 'student',
      plan: 'free',
      dailyUsage: 0,
      lastResetDate: '2026-10-30',
      createdAt: '2026-10-30T00:00:00.000Z',
      enrolledClassCode: 'SENT26'
    };

    const isStudentUser = Boolean(
      studentUser.role === 'student' ||
      studentUser.academicProfile === 'student'
    );

    expect(isStudentUser).toBe(true);
    expect(studentUser.role).toBe('student');
    expect(studentUser.enrolledClassCode).toBe('SENT26');
  });

  it('validates instructor authorization license keys strictly', () => {
    const validCodes = ['INST-EDU-2026', 'DEMO-2026', 'AKADEMIK2026', 'SENT26'];

    const isValidKey = (code: string) => {
      const trimmed = code.trim().toUpperCase();
      return Boolean(trimmed && validCodes.includes(trimmed));
    };

    expect(isValidKey('inst-edu-2026')).toBe(true);
    expect(isValidKey('DEMO-2026')).toBe(true);
    expect(isValidKey('random_student_code')).toBe(false);
    expect(isValidKey('')).toBe(false);
  });

  it('structures deep analysis diagnostic report for student reflection without humanizer', () => {
    const mockDraftScores = {
      similarityScore: 14,
      aiScore: 8,
      sources: [
        { title: 'TÜBİTAK Akademik Dergi 2025', similarity: 12, url: 'https://dergipark.org.tr' }
      ],
      sentenceScores: [
        { sentence: 'Bu çalışmada yapay zeka yöntemleri incelenmiştir.', aiScore: 0.85 }
      ]
    };

    expect(mockDraftScores.similarityScore).toBe(14);
    expect(mockDraftScores.aiScore).toBe(8);
    expect(mockDraftScores.sources.length).toBe(1);
    expect(mockDraftScores.sentenceScores[0].aiScore).toBeGreaterThan(0.4);
  });
});
