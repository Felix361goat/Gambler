"""
Phase-2 proof: does trend-following across UNCORRELATED assets beat buy-and-hold?

Three real monthly series (since ~1970, their common range):
  - Equities : S&P 500 (sp500_monthly.csv)
  - Gold     : USD/oz   (gold_monthly.csv)
  - Bonds    : US 10y total-return proxy from yields (bonds10y_monthly.csv)

Strategy = vol-targeted trend on each asset, combined:
  * signal: hold the asset only while its total-return index is above its
    10-month moving average (lagged 1 month -> no look-ahead);
  * size:   scale each asset to ~10% annualised vol using trailing 12m vol
    (risk parity), capped; combine and cap total portfolio leverage.
Benchmark = static 60/40 equities/bonds, buy & hold.

This is the honest test behind the ROADMAP's wealth engine. Diversification is
the 'free lunch': if it raises return-per-risk, leverage to a higher CAGR is
safer.
"""
import csv
import math
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def load(path, date_col, val_col, ymlen=7):
    out = {}
    for r in csv.DictReader(open(os.path.join(HERE, path))):
        try:
            v = float(r[val_col])
        except (ValueError, KeyError):
            continue
        out[r[date_col][:ymlen]] = v          # key = 'YYYY-MM'
    return out


def main():
    spx = load("sp500_monthly.csv", "Date", "SP500")
    gold = load("gold_monthly.csv", "Date", "Price")
    yld = load("bonds10y_monthly.csv", "Date", "Rate")

    months = sorted(set(spx) & set(gold) & set(yld))
    months = [m for m in months if m >= "1970-01"]

    # ---- monthly returns per asset ----
    DURATION = 7.0
    eq_r, gd_r, bd_r = [], [], []
    keys = []
    for i in range(1, len(months)):
        a, b = months[i-1], months[i]
        eq = spx[b]/spx[a] - 1
        gd = gold[b]/gold[a] - 1
        # bond total return proxy: carry + price change from yield move
        y0, y1 = yld[a]/100.0, yld[b]/100.0
        bd = y0/12.0 - DURATION * (y1 - y0)
        eq_r.append(eq); gd_r.append(gd); bd_r.append(bd); keys.append(b)

    assets = {"eq": eq_r, "gd": gd_r, "bd": bd_r}

    # total-return index per asset (for the trend signal)
    idx = {k: [1.0] for k in assets}
    for k, rs in assets.items():
        for r in rs:
            idx[k].append(idx[k][-1] * (1 + r))

    def sma(series, i, n):
        return sum(series[i-n:i]) / n if i >= n else None

    def trail_vol(rs, i, n=12):
        if i < n:
            return None
        w = rs[i-n:i]
        m = sum(w)/n
        return math.sqrt(sum((x-m)**2 for x in w)/n) * math.sqrt(12)

    TARGET_VOL = 0.10
    WEIGHT_CAP = 1.5
    PORT_LEV_CAP = 2.0

    def run_trend(port_lev_cap):
        eq_curve = [1.0]
        for i in range(1, len(keys)):
            month_ret, gross = 0.0, 0.0
            for k, rs in assets.items():
                s = sma(idx[k], i, 10)                 # signal from prior months
                in_mkt = (s is not None) and (idx[k][i] > s)
                v = trail_vol(rs, i)
                if not in_mkt or v is None or v == 0:
                    continue
                w = min(TARGET_VOL / v, WEIGHT_CAP)
                month_ret += w * rs[i]
                gross += w
            if gross > port_lev_cap:                   # cap total leverage
                month_ret *= port_lev_cap / gross
            eq_curve.append(eq_curve[-1] * (1 + month_ret))
        return eq_curve

    def run_6040():
        eq_curve = [1.0]
        for i in range(1, len(keys)):
            r = 0.6 * eq_r[i] + 0.4 * bd_r[i]
            eq_curve.append(eq_curve[-1] * (1 + r))
        return eq_curve

    def stats(curve):
        rs = [curve[i]/curve[i-1]-1 for i in range(1, len(curve))]
        yrs = len(rs)/12
        cagr = curve[-1]**(1/yrs) - 1
        m = sum(rs)/len(rs)
        vol = math.sqrt(sum((x-m)**2 for x in rs)/len(rs))*math.sqrt(12)
        peak, mdd = curve[0], 0.0
        for v in curve:
            peak = max(peak, v); mdd = max(mdd, (peak-v)/peak)
        pos = sum(1 for x in rs if x > 0)/len(rs)
        return cagr, vol, mdd, pos, curve[-1]

    print(f"Common monthly history: {keys[0]} .. {keys[-1]} "
          f"({len(keys)} months)\n")
    print(f"{'portfolio':<26}{'CAGR':>8}{'vol':>8}{'maxDD':>8}{'+mo':>7}{'x money':>10}")
    print("-"*67)
    for label, curve in [
        ("60/40 buy & hold", run_6040()),
        ("Diversified trend 1x", run_trend(1.0)),
        ("Diversified trend lev", run_trend(PORT_LEV_CAP)),
    ]:
        c, v, dd, p, mult = stats(curve)
        print(f"{label:<26}{c*100:7.2f}%{v*100:7.1f}%{dd*100:7.1f}%{p*100:6.0f}%{mult:9.1f}x")
    print("\nRead: if diversified trend shows higher CAGR AND lower maxDD than")
    print("60/40, the diversification+trend edge is real on this data — the")
    print("Sharpe gain is what makes the leveraged line a defensible wealth engine.")


if __name__ == "__main__":
    main()
