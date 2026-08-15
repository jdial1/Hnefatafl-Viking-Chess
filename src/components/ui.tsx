import React from 'react';
import { GoogleG, Shield, Swords } from '../icons';
import { PlayerRole } from '../types';
import { PLAYER_ROLES, ROLE_META } from '../utils/roles';

type Tone = 'default' | 'muted' | 'amber';
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'amber' | 'success';
type BtnSize = 'icon' | 'sm' | 'md' | 'lg';

const TONE: Record<Tone, string> = {
  default: 'bg-slate-950/70 border-slate-800',
  muted: 'bg-slate-950/35 border-slate-800/60',
  amber: 'bg-amber-500/10 border-slate-800',
};

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent',
  amber: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-transparent',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
};

const BTN_SIZE: Record<BtnSize, string> = {
  icon: 'p-1.5',
  sm: 'px-2 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-5 py-3 text-sm',
};

export function celticKnotClass(active = false, className = '') {
  return `relative celtic-knot-border ${active ? 'celtic-knot-active' : ''} ${className}`.trim();
}

export function Panel({
  tone = 'default',
  className = '',
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`rounded-xl border p-3.5 ${TONE[tone]} ${className}`}>{children}</div>;
}

export function Chip({
  title,
  className = '',
  children,
}: {
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      title={title}
      className={`flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs min-w-0 ${className}`}
    >
      {children}
    </div>
  );
}

export function Avatar({
  src,
  fallback,
  className = 'w-5 h-5 rounded-md',
}: {
  src?: string | null;
  fallback: React.ReactNode;
  className?: string;
}) {
  if (src) {
    return <img src={src} alt="" referrerPolicy="no-referrer" className={`object-cover shrink-0 ${className}`} />;
  }
  return <>{fallback}</>;
}

export function Btn({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GoogleSignInButton({
  onClick,
  disabled,
  iconOnly = false,
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Sign in with Google"
      title="Sign in with Google"
      className={`inline-flex items-center justify-center min-h-10 rounded bg-white text-[#1F1F1F] border border-[#747775] font-medium text-sm leading-none hover:bg-[#F8FAFF] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 disabled:opacity-40 disabled:cursor-not-allowed ${
        iconOnly ? 'px-0' : 'gap-3 px-3'
      } ${className}`}
    >
      <GoogleG className="w-[18px] h-[18px] shrink-0" />
      {!iconOnly && 'Sign in with Google'}
    </button>
  );
}

export function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={on}
      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors shrink-0 ${on ? 'bg-amber-500' : 'bg-slate-800'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${on ? 'translate-x-4.5' : 'translate-x-0'}`} />
    </button>
  );
}

export function Metric({
  label,
  value,
  valueClassName = 'text-slate-100',
  className = '',
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`font-mono ${className}`}>
      <div className={`font-bold text-base ${valueClassName}`}>{value}</div>
      <div className="text-slate-400 text-xs">{label}</div>
    </div>
  );
}

export function MetricRow({
  items,
  className = '',
}: {
  items: { label: string; value: React.ReactNode; valueClassName?: string }[];
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-3 divide-x divide-slate-800 py-3 ${className}`}>
      {items.map((metric) => (
        <Metric key={metric.label} {...metric} className="px-2 sm:px-3" />
      ))}
    </div>
  );
}

export function SectionTitle({
  icon: Icon,
  children,
  className = '',
  as: Tag = 'div',
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'h2' | 'h3';
}) {
  return (
    <Tag className={`flex items-center gap-2 font-semibold text-amber-300 text-sm ${className}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </Tag>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 text-xs">
      {children}
    </kbd>
  );
}

export function RoleIcon({ role, className = '' }: { role: PlayerRole; className?: string }) {
  if (role === 'defenders') return <Shield className={className} />;
  return <Swords className={`${className} rotate-90`} />;
}

export function RoleSummary({
  field,
  className = '',
}: {
  field: 'goal' | 'rules';
  className?: string;
}) {
  return (
    <div className={className}>
      {PLAYER_ROLES.map((role) => {
        const meta = ROLE_META[role];
        return (
          <div key={role} className="flex items-start gap-3 min-w-0">
            <RoleIcon role={role} className={`w-5 h-5 ${meta.colorClass} shrink-0 mt-0.5`} />
            {field === 'goal' ? (
              <div className="min-w-0">
                <span className="font-semibold text-slate-100 block">
                  {meta.plural} ({meta.force})
                </span>
                <span className="text-slate-300 text-sm block">{meta.goal}</span>
              </div>
            ) : (
              <span>
                <strong className="text-slate-100">{meta.plural} ({meta.force}):</strong> {meta.rules}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
