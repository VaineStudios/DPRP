import type { Shelter, DisasterEvent } from '../../api/client';
import NetworkStats from './NetworkStats';
import ParishBreakdown from './ParishBreakdown';
import CriticalAlerts from './CriticalAlerts';
import CapacityTrend from './CapacityTrend';

interface SidebarProps {
  shelters: Shelter[];
  activeEvent: DisasterEvent | null;
  collapsed: boolean;
  onToggle: () => void;
  onPanToShelter: (lat: number, lng: number, shelterId: string) => void;
  onPanToParish: (parish: string) => void;
}

const Sidebar = ({
  shelters,
  activeEvent,
  collapsed,
  onToggle,
  onPanToShelter,
  onPanToParish,
}: SidebarProps) => {
  if (collapsed) {
    return (
      <div style={styles.collapsed}>
        <button style={styles.toggleBtn} onClick={onToggle} title="Expand sidebar">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2l5 5-5 5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={styles.iconStrip}>
          <button style={styles.iconBtn} onClick={onToggle} title="Network overview">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v14M4 5v10M12 3v12" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button style={styles.iconBtn} onClick={onToggle} title="Parish breakdown">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M2 6h12M6 2v12" stroke="#94a3b8" strokeWidth="1" />
            </svg>
          </button>
          <button style={styles.iconBtn} onClick={onToggle} title="Critical alerts">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L15 14H1L8 1z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 6v4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button style={styles.iconBtn} onClick={onToggle} title="Capacity trend">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 12l4-4 3 2 7-8" stroke="#5DCAA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.sidebar}>
      <button style={styles.toggleBtnExpanded} onClick={onToggle} title="Collapse sidebar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2l-5 5 5 5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>Network overview</div>
        <NetworkStats shelters={shelters} />
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.sectionHeader}>Parish breakdown</div>
        <ParishBreakdown
          shelters={shelters}
          activeEvent={activeEvent}
          onParishClick={onPanToParish}
        />
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <CriticalAlerts
          shelters={shelters}
          onAlertClick={onPanToShelter}
        />
      </div>

      <div style={styles.divider} />

      <div style={styles.section}>
        <div style={styles.sectionHeader}>Capacity trend</div>
        <CapacityTrend shelters={shelters} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 280,
    flexShrink: 0,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto' as const,
    overflowX: 'hidden',
    position: 'relative',
    transition: 'width 0.2s ease',
  },
  collapsed: {
    width: 40,
    flexShrink: 0,
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    paddingTop: 8,
    gap: 4,
    transition: 'width 0.2s ease',
  },
  toggleBtn: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '50%',
    cursor: 'pointer',
    marginBottom: 8,
  },
  toggleBtnExpanded: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '50%',
    cursor: 'pointer',
    zIndex: 2,
  },
  iconStrip: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  section: {
    padding: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: '#94a3b8',
    marginBottom: 10,
  },
  divider: {
    height: 1,
    background: '#1e293b',
    margin: '0 12px',
  },
};

export default Sidebar;
