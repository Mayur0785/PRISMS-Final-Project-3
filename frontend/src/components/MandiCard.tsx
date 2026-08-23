import React from "react";
import { formatRupees, type MarketResult } from "@/lib/prisms";
import { t, type Lang } from "@/lib/i18n";
import { BorderBeam } from "./BorderBeam";

interface Props {
  result: MarketResult;
  lang: Lang;
  isBest: boolean;
  isHighestListed: boolean;
  bestNet: number;
  showTrend?: boolean;
  onSelectRoute?: (mandiId: string) => void;
}

export function MandiCard({
  result,
  lang,
  isBest,
  isHighestListed,
  bestNet,
  onSelectRoute,
}: Props) {
  const { market } = result;
  const name = market.name;
  const diffFromBest = bestNet - result.net;

  return (
    <article
      className={`relative bg-surface rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group ${
        isBest
          ? "border-primary/40 shadow-xl ring-2 ring-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent"
          : "border-outline-variant hover:border-outline hover:shadow-md"
      }`}
    >
      {isBest && <BorderBeam size={220} duration={6} colorFrom="#3b6934" colorTo="#fe932c" />}

      {/* Top Banner for Best Market */}
      {isBest ? (
        <div className="bg-primary px-5 py-2.5 text-on-primary flex items-center justify-between shadow-sm relative z-10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-amber-300">
              emoji_events
            </span>
            <span className="text-[13px] font-extrabold tracking-wide uppercase">
              {lang === "mr" ? "🏆 सर्वाधिक निव्वळ नफा देणारी बाजारपेठ" : "🏆 Highest Take-Home Profit"}
            </span>
          </div>
          <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {lang === "mr" ? "शिफारस" : "Recommended"}
          </span>
        </div>
      ) : null}

      <div className="p-5 sm:p-6 flex flex-col gap-4 relative z-10 flex-1">
        {/* Card Header: Name & Distance + Listed Rate + Provenance */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[20px] font-extrabold text-on-surface leading-tight group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">
                location_on
              </span>
              <span>
                {market.distance_km.toFixed(1)} km {lang === "mr" ? "लांब" : "away"}
              </span>
              <span className="text-outline">•</span>
              <span className="text-outline">
                {market.district}, {market.state}
              </span>
            </p>
            {/* Provenance Badge */}
            <div className="mt-1.5">
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                result.source === 'LIVE_GOVT_API'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-800 border-amber-500/30'
              }`}>
                {result.source === 'LIVE_GOVT_API'
                  ? (lang === 'mr' ? '🟢 सरकारी ताजी आकडेवारी (Data.gov.in)' : '🟢 LIVE Govt API (Data.gov.in)')
                  : (lang === 'mr' ? '📜 ऐतिहासिक बाजार निर्देशांक (APMC Benchmark)' : '📜 Historical APMC Benchmark')}
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/60">
            <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              {lang === "mr" ? "बाजार भाव" : "Listed Price"}
            </p>
            <p className="text-[18px] font-extrabold text-on-surface leading-none mt-0.5">
              {formatRupees(result.pricePerQtl)}
              <span className="text-[12px] font-bold text-outline"> /Qtl</span>
            </p>
            <p className="text-[10px] font-medium text-on-surface-variant mt-0.5">
              (₹{result.pricePerKg.toFixed(2)}/kg)
            </p>
          </div>
        </div>

        {/* You Take Home - Hero Profit Box */}
        <div
          className={`rounded-2xl p-4 sm:p-5 border transition-all ${
            isBest
              ? "bg-gradient-to-r from-primary/15 via-primary/5 to-success-sage/10 border-primary/30"
              : "bg-surface-container-low border-outline-variant/70"
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">
                account_balance_wallet
              </span>
              {lang === "mr" ? "हातात येणारा प्रत्यक्ष नफा" : "You Take Home"}
            </span>

            {isBest ? (
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary text-on-primary shadow-sm">
                {lang === "mr" ? "सर्वोत्तम" : "Best Choice"}
              </span>
            ) : diffFromBest > 0 ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-alert-terracotta/10 text-alert-terracotta border border-alert-terracotta/20">
                -₹{diffFromBest.toLocaleString("en-IN")} {lang === "mr" ? "सर्वोत्तमापेक्षा कमी" : "vs Best"}
              </span>
            ) : null}
          </div>

          <p className="text-[34px] sm:text-[38px] font-black text-primary tracking-tight leading-tight">
            {formatRupees(result.net)}
          </p>

          {isHighestListed && !isBest && (
            <p className="mt-2 text-[12px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span>⚠️</span>
              <span>
                {lang === "mr"
                  ? "या बाजारात दर जास्त दिसतो, पण वाहतूक खर्चामुळे निव्वळ नफा कमी आहे!"
                  : "High listed rate, but heavy transit costs reduce your real take-home!"}
              </span>
            </p>
          )}
        </div>

        {/* Where the money goes - Financial Waterfall Breakdown */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/70 p-3.5 space-y-2 text-[13px]">
          <p className="text-[11px] font-extrabold uppercase text-on-surface-variant tracking-wider pb-1 border-b border-outline-variant/40 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">receipt_long</span>
            {lang === "mr" ? "खर्च व नफा तपशील (रुपया कुठे जातो?)" : "Where the money goes"}
          </p>

          <div className="flex items-center justify-between text-on-surface">
            <span className="font-medium text-on-surface-variant">{lang === "mr" ? "एकूण विक्री मूल्य" : "Total Sale Value"}</span>
            <span className="font-bold">{formatRupees(result.gross)}</span>
          </div>

          <div className="flex items-center justify-between text-alert-terracotta">
            <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline">local_shipping</span>
              <span>{lang === "mr" ? "वाहतूक खर्च" : "Transport Freight"}</span>
            </span>
            <span className="font-bold">{result.transport === 0 ? "₹0" : `− ${formatRupees(result.transport)}`}</span>
          </div>

          <div className="flex items-center justify-between text-alert-terracotta">
            <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline">engineering</span>
              <span>{lang === "mr" ? "हमाली खर्च" : "Labour Cost"}</span>
            </span>
            <span className="font-bold">− {formatRupees(result.labour)}</span>
          </div>

          <div className="flex items-center justify-between text-alert-terracotta">
            <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline">eco</span>
              <span>
                {lang === "mr" ? "अंदाजित साठवणूक नासाडी नुकसान" : "Estimated Spoilage Loss"} ({Math.round(result.spoilagePct * 100)}%)
              </span>
            </span>
            <span className="font-bold">− {formatRupees(result.spoilage)}</span>
          </div>

          <div className="flex items-center justify-between text-alert-terracotta">
            <span className="flex items-center gap-1.5 font-medium text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-outline">percent</span>
              <span>
                {lang === "mr" ? "अंदाजित बाजार हाताळणी खर्च" : "Est. Market Handling Charges"} (1.0%)
              </span>
            </span>
            <span className="font-bold">− {formatRupees(result.commission)}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 font-extrabold text-[14px]">
            <span className="text-on-surface">{lang === "mr" ? "अंतिम निव्वळ नफा" : "Your Net Take-Home"}</span>
            <span className="text-primary text-[16px] font-black">{formatRupees(result.net)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
