import React from 'react';
import { ShieldCheck, Server, AlertTriangle, ArrowRight, BarChart3, Coins, Goal, CheckCircle2, Award } from 'lucide-react';
import { useLanguage } from '../translations';

interface PresentationLandingProps {
  onProceedToAuth: (mode: 'login' | 'register') => void;
}

export default function PresentationLanding({ onProceedToAuth }: PresentationLandingProps) {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6 animate-fadeIn pb-16">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-xs font-bold text-indigo-700 animate-slideDown">
          <ShieldCheck className="w-3.5 h-3.5" /> {t.landingBadge}
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#0F172A] tracking-tighter leading-none max-w-2xl mx-auto">
          {t.landingTitlePrefix}<span className="text-indigo-600 block sm:inline">{t.landingTitleHighlight}</span>
        </h1>
        <p className="text-sm text-slate-550 max-w-lg mx-auto leading-relaxed">
          {t.landingDesc}
        </p>
        
        {/* Call to Actions */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            id="landing-btn-register"
            onClick={() => onProceedToAuth('register')}
            className="w-full sm:w-auto px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 hover:shadow-indigo-100 transition-all cursor-pointer"
          >
            {t.landingStartFree}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            id="landing-btn-login"
            onClick={() => onProceedToAuth('login')}
            className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold border border-slate-200 rounded-xl text-xs justify-center flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
          >
            {t.landingLoginSecure}
          </button>
        </div>
      </div>

      {/* Main Benefits Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* Benefit 1 */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">{t.benefit1Title}</h2>
          <p className="text-xs text-slate-550 leading-relaxed">
            {t.benefit1Desc}
          </p>
        </div>

        {/* Benefit 2 - Dynamic Spend limits */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center">
            <Coins className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">{t.benefit2Title}</h2>
          <p className="text-xs text-slate-550 leading-relaxed">
            {t.benefit2Desc}
          </p>
        </div>

        {/* Benefit 3 - Milestone tracking */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 flex items-center justify-center">
            <Goal className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">{t.benefit3Title}</h2>
          <p className="text-xs text-slate-550 leading-relaxed">
            {t.benefit3Desc}
          </p>
        </div>

        {/* Benefit 4 - Nuvem Online Finantra */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-950 flex items-center justify-center">
            <Server className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">{t.benefit4Title}</h2>
          <p className="text-xs text-slate-550 leading-relaxed">
            {t.benefit4Desc}
          </p>
        </div>
      </div>

      {/* Safety Manifesto Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-md">
        <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 shrink-0">
          <ShieldCheck className="w-10 h-10 text-indigo-400" />
        </div>
        <div className="space-y-1.5 text-center md:text-left">
          <h3 className="font-bold text-sm text-slate-100 tracking-tight">{t.manifestoTitle}</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            {t.manifestoDesc}
          </p>
        </div>
      </div>
    </div>
  );
}

