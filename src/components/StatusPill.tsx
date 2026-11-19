import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AlertSeverity, CrowdingLevel, DecisionStatus } from '../types/database';

type PillVariant = DecisionStatus | AlertSeverity | CrowdingLevel;

interface StatusPillProps {
  variant: PillVariant;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusPill({
  variant,
  label,
  size = 'sm',
  className = '',
}: StatusPillProps) {
  const { t } = useTranslation();

  let styleClass = 'status-info';
  let Icon = Info;
  let defaultLabel = '';

  switch (variant) {
    case 'go':
    case 'low':
      styleClass = 'status-go';
      Icon = CheckCircle2;
      defaultLabel = variant === 'go' ? t('status.go') : t('status.low');
      break;
    case 'wait':
    case 'medium':
      styleClass = 'status-wait';
      Icon = Clock;
      defaultLabel = variant === 'wait' ? t('status.wait') : t('status.medium');
      break;
    case 'avoid':
    case 'high':
      styleClass = 'status-avoid';
      Icon = AlertTriangle;
      defaultLabel = variant === 'avoid' ? t('status.avoid') : t('status.high');
      break;
    case 'insufficient_data':
      styleClass = 'status-info';
      Icon = Info;
      defaultLabel = t('crops.crowdingInsufficient');
      break;
    case 'info':
    default:
      styleClass = 'status-info';
      Icon = Info;
      defaultLabel = t('status.info');
      break;
  }

  const sizeClass =
    size === 'md' ? 'px-3.5 py-1.5 text-sm gap-1.5' : 'px-2.5 py-1 text-xs gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold tracking-wide ${styleClass} ${sizeClass} ${className}`}
    >
      <Icon size={size === 'md' ? 16 : 13} strokeWidth={2.5} aria-hidden="true" />
      <span>{label ?? defaultLabel}</span>
    </span>
  );
}
