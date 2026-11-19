import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { MobileShell } from '../components/MobileShell';
import { useAppState } from '../context/AppStateContext';
import type { BillingCycle, SubscriptionTier } from '../types/database';

export function PlansPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, setPlan } = useAppState();

  const [cycle, setCycle] = useState<BillingCycle>(profile.billing_cycle);

  const plans: {
    id: SubscriptionTier;
    name: string;
    badge?: string;
    price: string;
    period?: string;
    perks: string[];
  }[] = [
    {
      id: 'free',
      name: t('common.free'),
      price: '₱0',
      perks: [
        'One crop & one field location',
        'Basic planting window & waterlogging alerts',
        'Offline crop guides, rain check-in & harvest form',
      ],
    },
    {
      id: 'pro',
      name: t('common.pro'),
      badge: 'Most popular',
      price: cycle === 'yearly' ? '₱690' : '₱69',
      period: cycle === 'yearly' ? '/ year (save 17%)' : '/ month',
      perks: [
        'All crops (rice, corn, root crops) & multiple parcels',
        'AI crop suggestions with nearby crowding indicator',
        'Pre-planting yield estimates & forecast accuracy reports',
      ],
    },
    {
      id: 'business',
      name: t('common.business'),
      price: 'Custom',
      period: 'LGUs & Cooperatives',
      perks: [
        'Everything in Agapay Pro',
        'Multi-user aggregated barangay LGU dashboard',
        'One-click PDF & CSV seasonal report export',
      ],
    },
  ];

  const handleSelect = (tier: SubscriptionTier) => {
    setPlan(tier, cycle);
    if (tier === 'business') {
      navigate('/lgu');
    } else {
      navigate(-1);
    }
  };

  return (
    <MobileShell showTabs={false}>
      <header className="flex items-start justify-between pb-4 pt-2">
        <div>
          <p className="text-xs font-semibold text-[var(--sub)]">Choose your plan</p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-[var(--ink)]">Plans</h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t('common.close')}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
        >
          <X size={20} />
        </button>
      </header>

      {/* Monthly / Yearly Toggle (Figma 08 Plans) */}
      <div className="mb-4 grid grid-cols-2 gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] p-1">
        {(['monthly', 'yearly'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className={`min-h-[44px] rounded-full text-sm font-bold capitalize transition ${
              cycle === c
                ? 'bg-[var(--accent)] text-[var(--on-accent)] shadow-xs'
                : 'text-[var(--sub)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3.5 pb-6">
        {plans.map((plan) => {
          const isCurrent = profile.subscription_tier === plan.id;
          return (
            <section
              key={plan.id}
              className={`ag-card p-5 transition ${
                plan.id === 'pro' || isCurrent ? 'border-2 border-[var(--accent)]' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-[var(--ink)]">{plan.name}</h2>
                  {plan.badge && (
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent)]">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[var(--ink)]">{plan.price}</span>
                  {plan.period && (
                    <p className="text-[11px] font-semibold text-[var(--sub)]">{plan.period}</p>
                  )}
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                    <Check size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" strokeWidth={2.8} />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => handleSelect(plan.id)}
                className={`mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full text-sm font-bold transition ${
                  isCurrent
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'bg-[var(--accent)] text-[var(--on-accent)]'
                }`}
              >
                {isCurrent ? 'Active plan' : `Switch to ${plan.name}`}
              </button>
            </section>
          );
        })}

        <p className="text-center text-xs text-[var(--muted)]">
          Pricing designed for Baybay City smallholders and subject to local cooperative validation.
        </p>
      </div>
    </MobileShell>
  );
}
