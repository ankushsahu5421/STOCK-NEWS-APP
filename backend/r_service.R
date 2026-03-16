# ===================================================
#   R STATISTICAL MICROSERVICE (Plumber API)
#   Handles: Backtesting, Risk Models, Technical Indicators
#   Run: Rscript -e "plumber::plumb('r_service.R')$run(port=8002)"
# ===================================================

library(plumber)
library(quantmod)
library(PerformanceAnalytics)
library(TTR)
library(jsonlite)
library(dplyr)

#* @apiTitle R Statistical Microservice
#* @apiDescription Backtesting and risk analysis for Indian equities

#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

# ─── Health Check ─────────────────────────────────────────────
#* @get /health
function() {
  list(status = "ok", service = "r-statistical", version = "1.0.0")
}

# ─── Technical Indicators ─────────────────────────────────────
#* Calculate RSI, MACD, Bollinger Bands for a given price series
#* @post /indicators
#* @param prices JSON array of closing prices
#* @param period RSI period (default 14)
function(req, prices, period = 14) {
  tryCatch({
    price_vec <- as.numeric(fromJSON(prices))
    price_xts <- xts(price_vec, order.by = seq(Sys.Date() - length(price_vec) + 1, Sys.Date(), by = "day"))

    # RSI
    rsi_vals <- RSI(price_xts, n = as.integer(period))

    # MACD
    macd_vals <- MACD(price_xts, nFast = 12, nSlow = 26, nSig = 9)

    # Bollinger Bands
    bb_vals <- BBands(price_xts, n = 20, sd = 2)

    n <- length(price_vec)

    list(
      rsi = list(
        current = round(as.numeric(tail(rsi_vals, 1)), 2),
        signal = ifelse(tail(rsi_vals, 1) > 70, "Overbought",
                 ifelse(tail(rsi_vals, 1) < 30, "Oversold", "Neutral")),
        series = round(as.numeric(tail(rsi_vals, 30)), 2)
      ),
      macd = list(
        macd_line  = round(as.numeric(tail(macd_vals[,1], 1)), 4),
        signal_line = round(as.numeric(tail(macd_vals[,2], 1)), 4),
        histogram  = round(as.numeric(tail(macd_vals[,3], 1)), 4),
        crossover  = ifelse(
          tail(macd_vals[,1], 1) > tail(macd_vals[,2], 1), "Bullish", "Bearish"
        )
      ),
      bollinger_bands = list(
        upper   = round(as.numeric(tail(bb_vals[,"up"], 1)), 2),
        middle  = round(as.numeric(tail(bb_vals[,"mavg"], 1)), 2),
        lower   = round(as.numeric(tail(bb_vals[,"dn"], 1)), 2),
        pct_b   = round(as.numeric(tail(bb_vals[,"pctB"], 1)), 4),
        signal  = ifelse(
          tail(price_vec, 1) > as.numeric(tail(bb_vals[,"up"], 1)), "Above Upper Band (Overbought)",
          ifelse(tail(price_vec, 1) < as.numeric(tail(bb_vals[,"dn"], 1)), "Below Lower Band (Oversold)", "Within Bands")
        )
      )
    )
  }, error = function(e) {
    list(error = as.character(e$message))
  })
}

# ─── Backtesting Engine ───────────────────────────────────────
#* Run a simple moving average crossover backtest
#* @post /backtest/ma_crossover
#* @param prices JSON array of OHLCV data
#* @param fast_period Fast MA period (default 20)
#* @param slow_period Slow MA period (default 50)
#* @param initial_capital Initial investment in INR
function(req, prices, fast_period = 20, slow_period = 50, initial_capital = 100000) {
  tryCatch({
    price_data <- fromJSON(prices)
    close_prices <- as.numeric(price_data$close)
    dates <- as.Date(price_data$date)

    price_xts <- xts(close_prices, order.by = dates)

    fast_ma <- SMA(price_xts, n = as.integer(fast_period))
    slow_ma  <- SMA(price_xts, n = as.integer(slow_period))

    # Generate signals: 1 = Buy, -1 = Sell, 0 = Hold
    signals <- rep(0, length(close_prices))
    position <- 0
    trades <- list()
    capital <- as.numeric(initial_capital)
    shares <- 0
    equity_curve <- rep(capital, length(close_prices))

    for (i in (as.integer(slow_period) + 1):length(close_prices)) {
      if (!is.na(fast_ma[i]) && !is.na(slow_ma[i])) {
        # Buy signal: fast crosses above slow
        if (as.numeric(fast_ma[i]) > as.numeric(slow_ma[i]) &&
            as.numeric(fast_ma[i-1]) <= as.numeric(slow_ma[i-1]) &&
            position == 0) {
          shares  <- floor(capital / close_prices[i])
          capital <- capital - (shares * close_prices[i])
          position <- 1
          signals[i] <- 1
          trades[[length(trades)+1]] <- list(
            type = "BUY", date = as.character(dates[i]),
            price = close_prices[i], shares = shares
          )
        }
        # Sell signal: fast crosses below slow
        else if (as.numeric(fast_ma[i]) < as.numeric(slow_ma[i]) &&
                 as.numeric(fast_ma[i-1]) >= as.numeric(slow_ma[i-1]) &&
                 position == 1) {
          capital  <- capital + (shares * close_prices[i])
          position <- 0
          signals[i] <- -1
          trades[[length(trades)+1]] <- list(
            type = "SELL", date = as.character(dates[i]),
            price = close_prices[i], shares = shares
          )
          shares <- 0
        }
      }
      equity_curve[i] <- capital + (shares * close_prices[i])
    }

    # Performance metrics
    final_value   <- capital + (shares * tail(close_prices, 1))
    total_return  <- (final_value - as.numeric(initial_capital)) / as.numeric(initial_capital) * 100
    bh_return     <- (tail(close_prices,1) - close_prices[1]) / close_prices[1] * 100

    # Daily returns for Sharpe ratio
    equity_xts    <- xts(equity_curve, order.by = dates)
    daily_returns <- dailyReturn(equity_xts)
    sharpe        <- SharpeRatio.annualized(daily_returns, Rf = 0.065/252)
    max_dd        <- maxDrawdown(daily_returns)

    list(
      strategy = paste0("MA Crossover (", fast_period, "/", slow_period, ")"),
      performance = list(
        initial_capital   = as.numeric(initial_capital),
        final_value       = round(final_value, 2),
        total_return_pct  = round(total_return, 2),
        buy_hold_return   = round(bh_return, 2),
        alpha             = round(total_return - bh_return, 2),
        sharpe_ratio      = round(as.numeric(sharpe), 3),
        max_drawdown_pct  = round(max_dd * 100, 2),
        total_trades      = length(trades),
        win_rate          = round(sum(signals == -1 & signals == 1) / max(length(trades), 1) * 100, 1)
      ),
      trades        = trades,
      equity_curve  = round(tail(equity_curve, 100), 2),
      signals_count = list(buy = sum(signals == 1), sell = sum(signals == -1))
    )
  }, error = function(e) {
    list(error = as.character(e$message))
  })
}

# ─── Value at Risk (VaR) & Risk Model ─────────────────────────
#* @post /risk/var
#* @param returns JSON array of daily return percentages
#* @param confidence_level Confidence level (default 0.95)
#* @param horizon Days ahead for risk (default 1)
function(req, returns, confidence_level = 0.95, horizon = 1) {
  tryCatch({
    ret_vec   <- as.numeric(fromJSON(returns)) / 100
    ret_xts   <- xts(ret_vec, order.by = seq(Sys.Date() - length(ret_vec), Sys.Date() - 1, by = "day"))
    conf      <- as.numeric(confidence_level)

    # Historical VaR
    hist_var  <- quantile(ret_vec, probs = 1 - conf, na.rm = TRUE)

    # Parametric VaR (Gaussian)
    mu        <- mean(ret_vec, na.rm = TRUE)
    sigma     <- sd(ret_vec, na.rm = TRUE)
    param_var <- mu + sigma * qnorm(1 - conf)

    # CVaR (Expected Shortfall)
    cvar      <- mean(ret_vec[ret_vec <= hist_var], na.rm = TRUE)

    # Annualized metrics
    ann_ret   <- mean(ret_vec, na.rm = TRUE) * 252
    ann_vol   <- sd(ret_vec, na.rm = TRUE) * sqrt(252)
    sharpe    <- (ann_ret - 0.065) / ann_vol

    list(
      var_metrics = list(
        historical_var_pct  = round(hist_var * 100 * sqrt(as.integer(horizon)), 3),
        parametric_var_pct  = round(param_var * 100 * sqrt(as.integer(horizon)), 3),
        cvar_expected_shortfall = round(cvar * 100, 3),
        confidence_level    = conf,
        horizon_days        = as.integer(horizon)
      ),
      risk_profile = list(
        annualized_return   = round(ann_ret * 100, 2),
        annualized_vol      = round(ann_vol * 100, 2),
        sharpe_ratio        = round(sharpe, 3),
        skewness            = round(skewness(ret_vec), 3),
        kurtosis            = round(kurtosis(ret_vec), 3),
        max_drawdown        = round(maxDrawdown(ret_xts) * 100, 2)
      ),
      interpretation = list(
        var_summary = paste0(
          "With ", conf*100, "% confidence, the maximum 1-day loss is ",
          round(abs(hist_var) * 100, 2), "%"
        ),
        risk_level = ifelse(ann_vol > 0.35, "High Risk",
                    ifelse(ann_vol > 0.20, "Moderate Risk", "Low Risk"))
      )
    )
  }, error = function(e) {
    list(error = as.character(e$message))
  })
}

# ─── Fear & Greed Index Calculator ────────────────────────────
#* @post /fear-greed
#* @param nifty_returns JSON of recent Nifty daily returns
#* @param advance_decline_ratio Market breadth ratio
#* @param put_call_ratio PCR from NSE
#* @param vix India VIX value
function(req, nifty_returns, advance_decline_ratio = 1.0,
         put_call_ratio = 1.0, vix = 15.0) {
  tryCatch({
    rets    <- as.numeric(fromJSON(nifty_returns))
    adr     <- as.numeric(advance_decline_ratio)
    pcr     <- as.numeric(put_call_ratio)
    vix_val <- as.numeric(vix)

    # Momentum score (0-100): based on 20-day vs 50-day MA signal
    ma20 <- mean(tail(rets, 20), na.rm = TRUE)
    ma50 <- mean(tail(rets, 50), na.rm = TRUE)
    momentum_score <- pmin(pmax((ma20/max(abs(ma50), 0.001) + 1) * 50, 0), 100)

    # Volatility score (inverted VIX — high VIX = fear)
    vix_score <- pmax(0, pmin(100, 100 - (vix_val - 10) * 4))

    # Breadth score (advance/decline)
    breadth_score <- pmin(100, (adr / 2) * 100)

    # Put/Call ratio score (high PCR = fear)
    pcr_score <- pmax(0, pmin(100, 100 - (pcr - 0.7) * 80))

    # Composite score (weighted)
    composite <- round(
      0.35 * momentum_score +
      0.25 * vix_score      +
      0.25 * breadth_score  +
      0.15 * pcr_score, 1
    )

    label <- ifelse(composite < 20, "Extreme Fear",
             ifelse(composite < 40, "Fear",
             ifelse(composite < 60, "Neutral",
             ifelse(composite < 80, "Greed", "Extreme Greed"))))

    list(
      score     = composite,
      label     = label,
      components = list(
        momentum  = round(momentum_score, 1),
        volatility = round(vix_score, 1),
        breadth   = round(breadth_score, 1),
        put_call  = round(pcr_score, 1)
      ),
      color     = ifelse(composite < 40, "#dc2626",
                 ifelse(composite < 60, "#d97706", "#16a34a")),
      timestamp = as.character(Sys.time())
    )
  }, error = function(e) {
    list(error = as.character(e$message))
  })
}
