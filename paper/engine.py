"""
Paper-trading ENGINE for the diversified trend wealth-engine.

Same logic as sim/diversified_trend.py, but packaged to run forward in time:
given price history up to 'today', it outputs the TARGET WEIGHT for each asset.
A portfolio then marks itself to market and applies those weights.

This is deliberately stateless & pure (history in -> weights out) so it can be
unit-tested against historical data AND driven live by real prices.
"""
import math


def sma(values, window):
    if len(values) < window:
        return None
    return sum(values[-window:]) / window


def trailing_vol(returns, window, periods_per_year):
    if len(returns) < window:
        return None
    w = returns[-window:]
    m = sum(w) / len(w)
    var = sum((x - m) ** 2 for x in w) / len(w)
    return math.sqrt(var) * math.sqrt(periods_per_year)


def target_weights(history, cfg):
    """
    history: {asset: [price, price, ...]}  (oldest -> newest, equal spacing)
    cfg: dict with sma_window, vol_window, target_vol, weight_cap,
         portfolio_leverage_cap, periods_per_year
    Returns: {asset: weight}  (0 if trend is down or not enough data)
    """
    weights = {}
    gross = 0.0
    for asset, prices in history.items():
        if len(prices) < max(cfg["sma_window"], cfg["vol_window"]) + 2:
            weights[asset] = 0.0
            continue
        # trend signal: price above its SMA (use the value as of the last close)
        ma = sma(prices, cfg["sma_window"])
        in_trend = ma is not None and prices[-1] > ma
        # trailing realised vol from recent returns
        rets = [prices[i] / prices[i - 1] - 1 for i in range(1, len(prices))]
        vol = trailing_vol(rets, cfg["vol_window"], cfg["periods_per_year"])
        if not in_trend or not vol:
            weights[asset] = 0.0
            continue
        w = min(cfg["target_vol"] / vol, cfg["weight_cap"])  # risk parity
        weights[asset] = w
        gross += w
    # cap total portfolio leverage
    cap = cfg["portfolio_leverage_cap"]
    if gross > cap and gross > 0:
        scale = cap / gross
        weights = {a: w * scale for a, w in weights.items()}
    return weights
