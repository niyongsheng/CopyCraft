import { useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function Section({
  label,
  children,
  className = '',
  icon,
  defaultOpen = true,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!label) {
    return <section className={`settings-card ${className}`}>{children}</section>;
  }

  return (
    <section className={`settings-card ${open ? 'is-open' : 'is-collapsed'} ${className}`}>
      <button
        type="button"
        className="card-header"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="card-header-label">
          {icon && <span className="card-header-icon">{icon}</span>}
          {label}
        </span>
        <ChevronDown
          size={14}
          className={`card-chevron ${open ? 'is-open' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="card-body">{children}</div>}
    </section>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const display = format ? format(value) : `${value}${unit}`;
  return (
    <div className="control-row slider-row">
      <span className="control-label">{label}</span>
      <div className="slider-wrap">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          style={{ '--fill': `${Math.max(0, Math.min(100, pct))}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <div className="stepper" title={display}>
        <span className="stepper-value">{display}</span>
        <span className="stepper-buttons">
          <button
            type="button"
            aria-label={`增加${label}`}
            onClick={() => onChange(Math.min(max, value + step))}
          >
            <ChevronUp size={11} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            aria-label={`减少${label}`}
            onClick={() => onChange(Math.max(min, value - step))}
          >
            <ChevronDown size={11} strokeWidth={2.4} />
          </button>
        </span>
      </div>
    </div>
  );
}

export function SelectRow<T extends string | number>({
  label,
  value,
  options,
  groups,
  onChange,
  icon,
}: {
  label: string;
  value: T;
  options?: { value: T; label: string }[];
  groups?: { label: string; options: { value: T; label: string }[] }[];
  onChange: (value: T) => void;
  icon?: ReactNode;
}) {
  const choices = groups ? groups.flatMap((group) => group.options) : (options ?? []);
  const renderOption = (option: { value: T; label: string }) => (
    <option key={String(option.value)} value={String(option.value)}>
      {option.label}
    </option>
  );

  return (
    <div className="control-row select-row">
      <span className="control-label">
        {icon}
        {label}
      </span>
      <div className="select-wrap">
        <select
          value={String(value)}
          onChange={(e) => {
            const next = choices.find((o) => String(o.value) === e.target.value);
            if (next) onChange(next.value);
          }}
        >
          {groups
            ? groups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map(renderOption)}
                </optgroup>
              ))
            : options?.map(renderOption)}
        </select>
        <ChevronDown size={12} className="select-chevron" />
      </div>
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className={`control-row toggle-row ${disabled ? 'is-disabled' : ''}`}>
      <div className="toggle-copy">
        <span className="control-label">{label}</span>
        {hint && <span className="control-hint">{hint}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-thumb" />
      </button>
    </div>
  );
}

export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="control-row color-row">
      <span className="control-label">{label}</span>
      <label className="color-swatch" style={{ background: value }} title={value}>
        <input
          type="color"
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

export function TextRow({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="control-row text-row">
      <span className="control-label">{label}</span>
      <input
        className="text-input"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SelectPill<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="select-pill">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={o.value === value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

