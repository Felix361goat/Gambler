"""
Honest long-horizon backtest: can a systematic rule beat buy-and-hold (ETF)?

Data: real S&P 500 monthly total-return series, 1871-2026 (155 years).
Strategies:
  BH    Buy & hold the index (the ETF benchmark).
  TREND Faber 10-month trend rule: hold when last month's price > its
        10-month moving average, otherwise sit in cash (0%). Signal is
        lagged one month -> no look-ahead.
  TRENDx2  Same rule but 2x leverage while invested (cost of leverage 4%/yr).

We report CAGR, volatility, MAX DRAWDOWN, % of POSITIVE MONTHS, and the worst
rolling 12 months -- so the 'it is NOT a smooth monthly paycheck' truth is
visible, not hidden.
"""
import csv, math

rows = list(csv.DictReader(open("sim/sp500_monthly.csv")))

# Build monthly total-return series (price change + dividend/12 when available)
dates, prices, divs = [], [], []
for r in rows:
    try:
        p = float(r["SP500"])
    except ValueError:
        continue
    if p <= 0:
        continue
    dates.append(r["Date"])
    prices.append(p)
    try:
        divs.append(float(r["Dividend"]))
    except ValueError:
        divs.append(0.0)

rets = [0.0]
for i in range(1, len(prices)):
    d = divs[i] if divs[i] > 0 else 0.0
    rets.append((prices[i] + d/12.0 - prices[i-1]) / prices[i-1])

def sma(series, i, n):
    if i < n: return None
    return sum(series[i-n:i]) / n

LEV_COST_M = 0.04/12  # monthly borrowing cost for the leveraged variant

def backtest(start_idx, leverage=1.0, use_trend=True):
    eq = 1.0
    curve = [eq]
    invested_prev = True
    for i in range(start_idx, len(rets)):
        if use_trend:
            s = sma(prices, i-1, 10)          # signal from PRIOR month (no lookahead)
            invested = (s is not None) and (prices[i-1] > s)
        else:
            invested = True
        if invested:
            r = rets[i] * leverage - (LEV_COST_M * (leverage - 1))
        else:
            r = 0.0
        eq *= (1 + r)
        curve.append(eq)
    return curve

def stats(curve, n_per_year=12):
    rs = [curve[i]/curve[i-1]-1 for i in range(1, len(curve))]
    yrs = len(rs)/n_per_year
    cagr = curve[-1]**(1/yrs) - 1
    mean = sum(rs)/len(rs)
    var = sum((x-mean)**2 for x in rs)/len(rs)
    vol = math.sqrt(var*n_per_year)
    peak, mdd = curve[0], 0.0
    for v in curve:
        peak = max(peak, v)
        mdd = max(mdd, (peak-v)/peak)
    pos = sum(1 for x in rs if x > 0)/len(rs)
    # worst rolling 12 months
    worst12 = min((curve[i]/curve[i-12]-1) for i in range(12, len(curve)))
    return cagr, vol, mdd, pos, worst12, curve[-1]

def find_start(year):
    for i, d in enumerate(dates):
        if d >= f"{year}-01":
            return i
    return 0

for label_period, yr in [("FULL 1871-2026", 0), ("since 1990", 1990), ("since 2010", 2010)]:
    si = 10 if yr == 0 else find_start(yr)
    print(f"\n================  {label_period}  ================")
    print(f"{'strategy':<10}{'CAGR':>8}{'vol':>8}{'maxDD':>8}{'+mo':>7}{'worst12m':>10}{'x money':>10}")
    for name, lev, trend in [("BuyHold",1.0,False),("Trend",1.0,True),("Trend x2",2.0,True)]:
        c = backtest(si, leverage=lev, use_trend=trend)
        cagr, vol, mdd, pos, w12, mult = stats(c)
        print(f"{name:<10}{cagr*100:7.2f}%{vol*100:7.1f}%{mdd*100:7.1f}%{pos*100:6.0f}%{w12*100:9.1f}%{mult:9.1f}x")
