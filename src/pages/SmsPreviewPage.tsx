import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Send, SignalZero, Smartphone } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';

interface SmsMessage {
  id: string;
  sender: 'agapay' | 'farmer';
  text: string;
  time: string;
}

const QUICK_COMMANDS = [
  {
    code: 'PLANT GABAS CORN',
    reply:
      'AGAPAY Brgy. Gabas (Corn): WAIT 2-3 days. Window Nov 20-28. Soil 38% wet (Sentinel-1). Check drainage ditches before sowing. Reply RAIN LIGHT/HEAVY to update.',
  },
  {
    code: 'RAIN HEAVY GABAS',
    reply:
      'Salamat! Heavy rain check-in logged for Brgy. Gabas. Your report helps calibrate local Baybay City forecasts.',
  },
  {
    code: 'HARVEST CORN 54',
    reply:
      'Harvest logged: Corn 54 sacks/ha (Brgy. Gabas). This improves next-season yield predictions for your area.',
  },
];

export function SmsPreviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<SmsMessage[]>([
    {
      id: 'm1',
      sender: 'agapay',
      text: 'AGAPAY ALERT (Brgy. Gabas): Heavy rain expected Nov 18 (35-50mm). Delay corn sowing 3 days & clear ditches. Works with zero mobile data.',
      time: '07:00 AM',
    },
  ]);

  const sendCommand = (code: string, reply: string) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: `f-${Date.now()}`, sender: 'farmer', text: code, time: now },
      { id: `a-${Date.now() + 1}`, sender: 'agapay', text: reply, time: now },
    ]);
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-center gap-3 pb-4 pt-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
            Basic Phone · Zero Data
          </p>
          <h1 className="text-2xl font-bold text-[var(--ink)]">Agapay SMS</h1>
        </div>
      </header>

      <div className="ag-card mb-4 flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <SignalZero size={20} />
        </span>
        <div className="text-sm leading-snug text-[var(--sub)]">
          <p className="font-semibold text-[var(--ink)]">No mobile data or keypad phone?</p>
          <p className="mt-0.5">
            Text <strong className="text-[var(--ink)]">2929-AGAPAY</strong> for planting windows,
            waterlogging alerts, and rain check-ins.
          </p>
        </div>
      </div>

      {/* Interactive SMS thread */}
      <section className="ag-card mb-4 space-y-3 p-4">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5 text-xs font-semibold text-[var(--sub)]">
          <Smartphone size={15} />
          <span>SMS Gateway · 2929-AGAPAY</span>
        </div>

        <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'farmer' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.sender === 'farmer'
                    ? 'rounded-br-sm bg-[var(--accent)] font-medium text-[var(--on-accent)]'
                    : 'rounded-bl-sm bg-[var(--surface-muted)] text-[var(--ink)]'
                }`}
              >
                {msg.text}
              </div>
              <span className="mt-1 text-[11px] text-[var(--muted)]">{msg.time}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick tap SMS commands */}
      <section className="space-y-2 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--sub)]">
          Tap a text command to test
        </p>
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.code}
            type="button"
            onClick={() => sendCommand(cmd.code, cmd.reply)}
            className="flex min-h-[52px] w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--accent)]"
          >
            <span className="font-mono text-sm font-bold text-[var(--ink)]">{cmd.code}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Send size={15} />
            </span>
          </button>
        ))}
      </section>
    </MobileShell>
  );
}
