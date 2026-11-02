import React from "react";
import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 my-3 flex items-start sm:items-center gap-3 text-amber-900 text-xs sm:text-sm shadow-sm">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
      <div>
        <span className="font-bold text-amber-950">SEBI Compliance Notice: </span>
        MarketMind India is strictly an educational & quantitative analytics platform. It does NOT provide SEBI-registered financial, investment, or trading advice. Past performance is no guarantee of future returns.
      </div>
    </div>
  );
}
