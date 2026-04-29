import type { HabitProgress, HabitDayProgressSummary } from '@planner/core';

type ProgressLike = Pick<
  HabitProgress | HabitDayProgressSummary,
  'basePercent' | 'overchargePercent'
>;

interface Props {
  progress: ProgressLike;
  height?: number;
}

export function HabitProgressBar({ progress, height = 6 }: Props) {
  const baseWidth = Math.min(progress.basePercent, 100);
  const overchargeWidth = Math.min(progress.overchargePercent, 100);

  return (
    <div style={{
      position: 'relative',
      height,
      borderRadius: height,
      background: 'var(--progress-bg)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        width: `${baseWidth}%`,
        borderRadius: height,
        background: baseWidth >= 100 ? 'var(--progress-green)' : 'var(--accent)',
        transition: 'width var(--transition-slow)',
      }} />
      {progress.overchargePercent > 0 && (
        <div style={{
          position: 'absolute',
          inset: 0,
          width: `${overchargeWidth}%`,
          borderRadius: height,
          background: 'linear-gradient(90deg, #10b981, #06b6d4, #f59e0b, #ef4444)',
          boxShadow: '0 0 12px rgba(6, 182, 212, 0.45)',
          transition: 'width var(--transition-slow)',
        }} />
      )}
    </div>
  );
}
