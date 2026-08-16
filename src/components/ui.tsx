import React from 'react';
import { Crown, GoogleG, Shield, Swords, User } from '../icons';
import { PieceCounts, PlayerRole } from '../types';
import { PLAYER_ROLES, ROLE_META, forceStats } from '../utils/roles';

type Tone = 'default' | 'muted' | 'amber';
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'amber' | 'success' | 'danger';
type BtnSize = 'icon' | 'sm' | 'md' | 'lg';

const TONE: Record<Tone, string> = {
  default: 'bg-slate-900 border-slate-800',
  muted: 'bg-slate-950/35 border-slate-800/60',
  amber: 'bg-amber-500/10 border-slate-800',
};

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
  secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
  ghost: 'bg-transparent hover:bg-slate-800 text-slate-300 border border-transparent',
  amber: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-transparent',
  success: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold',
  danger: 'bg-transparent hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-transparent',
};

const BTN_SIZE: Record<BtnSize, string> = {
  icon: 'p-1.5',
  sm: 'px-2 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-5 py-3 min-h-14 text-sm sm:text-base',
};

export function celticKnotClass(active = false, className = '') {
  return `relative celtic-knot-border ${active ? 'celtic-knot-active' : ''} ${className}`.trim();
}

export function Panel({
  tone = 'default',
  knot = false,
  knotActive = false,
  className = 'p-3.5',
  children,
}: {
  tone?: Tone;
  knot?: boolean;
  knotActive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = `rounded-xl border ${TONE[tone]} ${className}`;
  return <div className={knot ? celticKnotClass(knotActive, classes) : classes}>{children}</div>;
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
  signedIn,
  className = 'w-5 h-5 rounded-md',
  iconClassName = 'w-4 h-4 shrink-0',
}: {
  src?: string | null;
  fallback?: React.ReactNode;
  signedIn?: boolean;
  className?: string;
  iconClassName?: string;
}) {
  if (src) {
    return <img src={src} alt="" referrerPolicy="no-referrer" className={`object-cover shrink-0 ${className}`} />;
  }
  if (fallback) return <>{fallback}</>;
  if (signedIn) return <GoogleG className={iconClassName} />;
  return <User className={`${iconClassName} text-emerald-400`} />;
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
  className = '',
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Sign in with Google"
      title="Sign in with Google"
      className={`inline-flex items-center justify-center gap-3 min-h-14 px-4 rounded-lg bg-[#131314] text-[#E3E3E3] border border-[#8E918F] font-medium text-sm leading-none hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <GoogleG className="w-[18px] h-[18px] shrink-0" />
      Sign in with Google
    </button>
  );
}

function CarveCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden>
      <path
        d="M3.5 10.5 L8 15.5 L16.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={on}
      className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
        on
          ? 'border-amber-500/60 bg-slate-950 text-amber-400'
          : 'border-slate-700 bg-slate-950 text-slate-600'
      }`}
    >
      {on ? <CarveCheck className="w-5 h-5" /> : <span className="w-4 h-4 rounded-sm border border-current" />}
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
    <div className={`flex items-baseline justify-between gap-4 ${className}`}>
      <dt className="text-sm text-slate-300">{label}</dt>
      <dd className={`font-mono font-semibold text-base tabular-nums ${valueClassName}`}>{value}</dd>
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
    <dl className={`divide-y divide-slate-800 ${className}`}>
      {items.map((metric) => (
        <Metric key={metric.label} {...metric} className="py-2.5" />
      ))}
    </dl>
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
  return <Swords className={className} />;
}

export function ForceCounts({
  pieceCounts,
  capClassName = 'font-mono text-xs text-slate-400',
  className = '',
}: {
  pieceCounts: PieceCounts;
  capClassName?: string;
  className?: string;
}) {
  return (
    <>
      {PLAYER_ROLES.map((role) => {
        const { meta, live, lost, cap } = forceStats(role, pieceCounts);
        return (
          <div
            key={role}
            className={`flex items-center gap-1.5 ${meta.mutedClass} ${className}`}
            title={`${meta.plural} ${live}/${cap}`}
          >
            <RoleIcon role={role} className={`w-3.5 h-3.5 ${meta.colorClass}`} />
            <span className={`font-mono font-semibold ${meta.countClass}`}>{live}</span>
            <span className={capClassName}>/{cap}</span>
            {role === 'defenders' && pieceCounts.hasKing && (
              <Crown className="w-3.5 h-3.5 text-amber-300" />
            )}
            {lost > 0 && <span className="font-mono text-xs text-rose-300">-{lost}</span>}
          </div>
        );
      })}
    </>
  );
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

export class ViewErrorBoundary extends React.Component<
  { fallback: React.ReactNode; onError?: () => void; resetKey?: string | number; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  componentDidUpdate(prevProps: { resetKey?: string | number }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
