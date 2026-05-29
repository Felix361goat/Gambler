"""
Honest reality-check simulation for an AGGRESSIVE small account.

Question: if I try to multiply EUR 1,000 by taking leveraged directional
trades (crypto perps / breakouts), what actually happens to the distribution
of outcomes? How often do I 3x? How often do I blow up?

We do NOT assume a magic edge. We test a few realistic edge levels and
position sizes, because the whole point is to show how sizing — not the
'system' — decides whether you survive long enough to win.
"""
import numpy as np

RNG = np.random.default_rng(7)
N_PATHS   = 50000
N_TRADES  = 40           # ~ a few weeks to a couple months of active trading
START     = 1000.0
RUIN_LEVEL = 0.40        # consider account "dead" if it drops below 40% of start
TARGET_MULT = 3.0        # "proper money" goal: triple it

def run(label, win_rate, win_R, loss_R, risk_frac):
    """
    win_R / loss_R = reward and loss as multiples of the amount risked.
    risk_frac      = fraction of CURRENT bankroll risked per trade.
    Realistic crypto momentum: ~40% win rate but winners bigger than losers.
    """
    finals = np.empty(N_PATHS)
    ruined = 0
    hit_target = 0
    for i in range(N_PATHS):
        bank = START
        dead = False
        for _ in range(N_TRADES):
            risk = bank * risk_frac
            if RNG.random() < win_rate:
                bank += risk * win_R
            else:
                bank -= risk * loss_R
            if bank < START * RUIN_LEVEL:
                dead = True
                break
        finals[i] = bank
        if dead:
            ruined += 1
        if finals[i] >= START * TARGET_MULT:
            hit_target += 1
    med = np.percentile(finals, 50)
    print(f"\n{label}")
    print(f"   win {win_rate:.0%}  payoff +{win_R}R/-{loss_R}R  risk {risk_frac:.0%}/trade")
    print(f"   median end: EUR {med:7.0f}   p25 {np.percentile(finals,25):6.0f}  p75 {np.percentile(finals,75):6.0f}  p95 {np.percentile(finals,95):7.0f}")
    print(f"   P(triple to 3000+): {hit_target/N_PATHS*100:5.1f}%    P(blow up <40%): {ruined/N_PATHS*100:5.1f}%")

print(f"=== Aggressive EUR 1,000 account, {N_TRADES} trades ===")

# A) NO real edge (coin flip, symmetric) — sized big. The "degen" baseline.
run("A) No edge, big size", win_rate=0.50, win_R=1.0, loss_R=1.0, risk_frac=0.20)

# B) Small realistic edge, OVER-sized (what most people do). Greedy.
run("B) Small edge, oversized", win_rate=0.40, win_R=2.0, loss_R=1.0, risk_frac=0.25)

# C) SAME small edge, DISCIPLINED size (the only thing that changed).
run("C) Small edge, disciplined size", win_rate=0.40, win_R=2.0, loss_R=1.0, risk_frac=0.05)

# D) Barbell convex: mostly miss, rare big winners (asymmetric / OTM-option style)
run("D) Convex barbell (lottery-like)", win_rate=0.18, win_R=8.0, loss_R=1.0, risk_frac=0.06)
