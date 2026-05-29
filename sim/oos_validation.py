"""
OUT-OF-SAMPLE / robustness test for the diversified trend engine.

The honest question: does the edge beat a plain ETF (and 60/40) on data the
rule wasn't chosen on — and across DIFFERENT regimes (decades)? If it only
works 1970-2000 but not after, it's a relic, not an edge.

Checks:
  1. Split sample: 1970-1997 (in-sample era) vs 1998-2026 (out-of-sample).
  2. Decade by decade.
  3. Parameter sensitivity (8/10/12-month trend) — stable => not overfit.
  4. NET OF COSTS: turnover * cost_bps each month (honest friction).

Benchmarks: Equities buy&hold (the ETF the user would otherwise just buy) and
static 60/40. Data: sp500 + gold + bonds monthly (same as diversified_trend).
"""
import csv
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))
COST_BPS = 0.0010   # 10 bps per unit of turnover per month (round-trip friction)


def load(path, dcol, vcol):
    out = {}
    for r in csv.DictReader(open(os.path.join(HERE, path))):
        try:
            out[r[dcol][:7]] = float(r[vcol])
        except (ValueError, KeyError):
            pass
    return out


def build():
    spx = load("sp500_monthly.csv", "Date", "SP500")
    gold = load("gold_monthly.csv", "Date", "Price")
    yld = load("bonds10y_monthly.csv", "Date", "Rate")
    months = sorted(set(spx) & set(gold) & set(yld))
    months = [m for m in months if m >= "1970-01"]
    D = 7.0
    rows = []  # (month, eq_r, gd_r, bd_r)
    for i in range(1, len(months)):
        a, b = months[i-1], months[i]
        eq = spx[b]/spx[a] - 1
        gd = gold[b]/gold[a] - 1
        y0, y1 = yld[a]/100, yld[b]/100
        bd = y0/12 - D*(y1 - y0)
        rows.append((b, eq, gd, bd))
    return rows


def sma(seq, n):
    return sum(seq[-n:])/n if len(seq) >= n else None


def trend_curve(rows, sma_w=10, vol_w=12, tvol=0.10, wcap=1.5, levcap=2.0,
                start=None, end=None, costs=True):
    # build per-asset price index + returns history up front
    idx = {"eq": [1.0], "gd": [1.0], "bd": [1.0]}
    rets = {"eq": [], "gd": [], "bd": []}
    eq_curve, dates = [1.0], []
    prev_w = {"eq": 0.0, "gd": 0.0, "bd": 0.0}
    for (m, eq, gd, bd) in rows:
        cur = {"eq": eq, "gd": gd, "bd": bd}
        # decide weights from history BEFORE this month (no lookahead)
        w = {}
        gross = 0.0
        for k in cur:
            ma = sma(idx[k], sma_w)
            in_trend = ma is not None and idx[k][-1] > ma
            v = None
            if len(rets[k]) >= vol_w:
                wv = rets[k][-vol_w:]
                mu = sum(wv)/len(wv)
                v = math.sqrt(sum((x-mu)**2 for x in wv)/len(wv))*math.sqrt(12)
            if in_trend and v:
                w[k] = min(tvol/v, wcap); gross += w[k]
            else:
                w[k] = 0.0
        if gross > levcap and gross > 0:
            w = {k: x*levcap/gross for k, x in w.items()}
        # apply this month's return if in the requested window
        in_window = (start is None or m >= start) and (end is None or m < end)
        if in_window:
            ret = sum(w[k]*cur[k] for k in cur)
            if costs:
                turnover = sum(abs(w[k]-prev_w[k]) for k in cur)
                ret -= turnover * COST_BPS
            eq_curve.append(eq_curve[-1]*(1+ret)); dates.append(m)
        prev_w = w
        # advance history
        for k in cur:
            rets[k].append(cur[k]); idx[k].append(idx[k][-1]*(1+cur[k]))
    return eq_curve


def bh_curve(rows, kind, start=None, end=None):
    c = [1.0]
    for (m, eq, gd, bd) in rows:
        if (start and m < start) or (end and m >= end):
            continue
        r = eq if kind == "eq" else 0.6*eq + 0.4*bd
        c.append(c[-1]*(1+r))
    return c


def stats(c):
    rs = [c[i]/c[i-1]-1 for i in range(1, len(c))]
    if not rs:
        return (0, 0, 0)
    yrs = len(rs)/12
    cagr = c[-1]**(1/yrs)-1
    peak, mdd = c[0], 0.0
    for v in c:
        peak = max(peak, v); mdd = max(mdd, (peak-v)/peak)
    return cagr, mdd, c[-1]


def line(label, c):
    cagr, mdd, mult = stats(c)
    print(f"  {label:<26}{cagr*100:7.2f}% CAGR  {mdd*100:6.1f}% maxDD  {mult:7.1f}x")


def section(title, rows, start, end):
    print(f"\n=== {title} (net of {COST_BPS*1e4:.0f}bps/turnover) ===")
    line("Equities buy&hold (ETF)", bh_curve(rows, "eq", start, end))
    line("60/40 buy&hold", bh_curve(rows, "bd6040", start, end))
    line("Diversified trend 1x", trend_curve(rows, levcap=1.0, start=start, end=end))
    line("Diversified trend lev", trend_curve(rows, levcap=2.0, start=start, end=end))


def main():
    rows = build()
    print(f"Data: {rows[0][0]} .. {rows[-1][0]}  ({len(rows)} months)")
    section("FULL SAMPLE", rows, None, None)
    section("IN-SAMPLE 1970-1997", rows, "1970-01", "1998-01")
    section("OUT-OF-SAMPLE 1998-2026", rows, "1998-01", None)
    for d in range(1970, 2026, 10):
        section(f"DECADE {d}s", rows, f"{d}-01", f"{d+10}-01")
    print("\nParameter sensitivity (OOS 1998-2026, levered, net):")
    for sw in (8, 10, 12):
        c = trend_curve(rows, sma_w=sw, levcap=2.0, start="1998-01")
        cg, dd, _ = stats(c)
        print(f"  {sw}-month trend: {cg*100:6.2f}% CAGR, {dd*100:.1f}% maxDD")
    print("\nVerdict rule: trend is only worth it if it beats Equities-B&H on a")
    print("RISK-ADJUSTED basis (similar/better CAGR at clearly lower drawdown)")
    print("in BOTH halves and most decades. Otherwise: just buy the ETF.")


if __name__ == "__main__":
    main()
