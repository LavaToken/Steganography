import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Navbar from '../components/Navbar';
import HistorySidebar from '../components/HistorySidebar';
import EncodePanel from '../components/EncodePanel';
import DecodePanel from '../components/DecodePanel';

type Tab = 'encode' | 'decode';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="h-11 flex items-end px-5 border-b border-[var(--border)] shrink-0">
      {(['encode', 'decode'] as Tab[]).map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-[var(--transition)] capitalize
            ${active === tab
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:border-[var(--border)]'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export default function MainApp() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('encode');
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('sidebar-collapsed', false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {/* Sidebar — only for authenticated users */}
      {isAuthenticated && (
        <HistorySidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(v => !v)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Guest navbar */}
        {!isAuthenticated && <Navbar />}

        {/* Tabs */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Panel fills remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === 'encode' ? <EncodePanel /> : <DecodePanel />}
        </div>
      </div>
    </div>
  );
}
