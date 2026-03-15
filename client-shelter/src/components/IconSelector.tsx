interface IconSelectorProps {
  label: string;
  icon: 'people' | 'water' | 'food' | 'medical';
  value: number | null;
  onChange: (level: number) => void;
  /** If true, low values = bad (red), high = good (green). Used for resources. */
  invertColors?: boolean;
}

const getColor = (level: number, filled: boolean, invert: boolean): string => {
  if (!filled) return '#cbd5e1';
  if (invert) {
    // Resources: 1-2 red (low stock bad), 3 amber, 4-5 green (well stocked good)
    if (level <= 2) return '#ef4444';
    if (level === 3) return '#f59e0b';
    return '#22c55e';
  }
  // Capacity: 1-2 green (low occupancy good), 3 amber, 4-5 red (full bad)
  if (level <= 2) return '#22c55e';
  if (level === 3) return '#f59e0b';
  return '#ef4444';
};

const getStatusText = (value: number | null, invert: boolean): string => {
  if (value === null) return 'Not set';
  if (invert) {
    if (value <= 2) return 'Running low';
    if (value === 3) return 'Moderate';
    return 'Well stocked';
  }
  if (value <= 2) return 'Low';
  if (value === 3) return 'Moderate';
  if (value === 4) return 'High';
  return 'Critical';
};

const PersonIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="7" r="4" />
    <path d="M12 13c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
  </svg>
);

const WaterIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C12 2 5 11 5 15.5C5 19.09 8.13 22 12 22C15.87 22 19 19.09 19 15.5C19 11 12 2 12 2Z" />
  </svg>
);

const FoodIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <path d="M4 4h16v2H4zM3 7h18v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm4 3v7h2v-7H7zm4 0v7h2v-7h-2zm4 0v7h2v-7h-2z" />
  </svg>
);

const MedicalIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={color}>
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />
  </svg>
);

const ICONS = { people: PersonIcon, water: WaterIcon, food: FoodIcon, medical: MedicalIcon };

const IconSelector = ({ label, icon, value, onChange, invertColors = false }: IconSelectorProps) => {
  const IconComponent = ICONS[icon];
  const statusText = getStatusText(value, invertColors);
  const statusColor = value === null ? '#94a3b8' : getColor(value, true, invertColors);

  return (
    <div style={styles.container}>
      <p style={styles.label}>{label}</p>
      <div style={styles.row}>
        {[1, 2, 3, 4, 5].map((level) => {
          const filled = value !== null && level <= value;
          const color = getColor(value ?? level, filled, invertColors);
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              style={styles.iconButton}
              aria-label={`Set ${icon} to level ${level} of 5`}
            >
              <IconComponent color={color} />
            </button>
          );
        })}
      </div>
      <p style={{ ...styles.status, color: statusColor }}>{statusText}</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 6,
  },
  row: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    minHeight: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: 0,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  status: {
    fontSize: 13,
    fontWeight: 500,
    textAlign: 'center',
    marginTop: 4,
  },
};

export default IconSelector;
