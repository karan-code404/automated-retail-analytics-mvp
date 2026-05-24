import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

def fit_regression_for_scale(time_data, scale_name, domain):
    """
    Fits regression model and forecasts next 6 periods for a specific time data scale.
    """
    if len(time_data) < 3:
        # Fallback if too few data points to regression
        historical = [{"date": f"{scale_name.capitalize()} {i+1}", "actual": float(100 + i*10 + np.random.randint(-5, 5))} for i in range(5)]
        forecast = []
        last_val = historical[-1]["actual"]
        for i in range(6):
            proj = last_val + (i+1)*8
            forecast.append({
                "date": f"Forecast {i+1}",
                "actual": None,
                "forecast": round(float(proj), 2),
                "upper": round(float(proj * 1.15), 2),
                "lower": round(float(max(0, proj * 0.85)), 2)
            })
        return historical + forecast, f"Simulated data. Enforce more transaction dates to compute {scale_name} linear regression."

    # Extract X and Y
    dates = [item['date'] for item in time_data]
    y = np.array([item['value'] for item in time_data]).reshape(-1, 1)
    x = np.arange(len(dates)).reshape(-1, 1)

    # Fit linear regression
    model = LinearRegression()
    model.fit(x, y)
    
    # Calculate standard error of residuals
    predictions = model.predict(x)
    residuals = y - predictions
    std_error = np.std(residuals)
    if std_error == 0:
        std_error = float(np.mean(y) * 0.1)

    # Prepare historical data points
    forecast_data = []
    for i, item in enumerate(time_data):
        forecast_data.append({
            "date": item['date'],
            "actual": float(item['value']),
            "forecast": None,
            "upper": None,
            "lower": None
        })

    # Generate next 6 periods
    last_date = dates[-1]
    
    for i in range(1, 7):
        # Generate next period date string representation
        next_date_str = ""
        if scale_name == 'daily':
            try:
                next_date_str = (pd.to_datetime(last_date) + pd.Timedelta(days=i)).strftime('%Y-%m-%d')
            except Exception:
                next_date_str = f"Day +{i}"
        elif scale_name == 'weekly':
            try:
                next_date_str = (pd.to_datetime(last_date) + pd.Timedelta(weeks=i)).strftime('%Y-%m-%d')
            except Exception:
                next_date_str = f"Week +{i}"
        elif scale_name == 'monthly':
            try:
                last_yr, last_mo = map(int, last_date.split('-'))
                next_mo = last_mo + i
                next_yr = last_yr + (next_mo - 1) // 12
                next_mo = (next_mo - 1) % 12 + 1
                next_date_str = f"{next_yr}-{next_mo:02d}"
            except Exception:
                next_date_str = f"Month +{i}"
        else: # Yearly
            try:
                next_date_str = str(int(last_date) + i)
            except Exception:
                next_date_str = f"Year +{i}"
        
        # Predict
        next_x = np.array([[len(dates) + i - 1]])
        pred_val = float(model.predict(next_x)[0, 0])
        
        # Calculate bounds
        upper_bound = pred_val + 1.96 * std_error
        lower_bound = max(0.0, pred_val - 1.96 * std_error)
        
        forecast_data.append({
            "date": next_date_str,
            "actual": None,
            "forecast": round(pred_val, 2),
            "upper": round(upper_bound, 2),
            "lower": round(lower_bound, 2)
        })

    slope = float(model.coef_[0, 0])
    direction = "upward" if slope >= 0 else "downward"
    pct_trend = (slope / np.mean(y) * 100) if np.mean(y) > 0 else 0.0
    summary_desc = f"Least-squares fit indicates a structural {direction} trend on a {scale_name} scale. Speed is projected at {pct_trend:+.1f}% growth rate per period, with a residual standard error margin of ±{std_error:,.0f}."

    return forecast_data, summary_desc

def generate_time_forecast(df, breakdowns, domain):
    """
    Fits regressions across all four time scales (daily, weekly, monthly, yearly)
    and returns a combined projections map.
    """
    time_breakdowns = breakdowns.get("time_breakdowns", {})
    
    forecasts = {}
    summaries = {}
    
    for scale in ['daily', 'weekly', 'monthly', 'yearly']:
        time_data = time_breakdowns.get(scale, [])
        f_data, f_summary = fit_regression_for_scale(time_data, scale, domain)
        forecasts[scale] = f_data
        summaries[scale] = f_summary

    # Churn Risk Calculation
    churn_risk = 0.0
    churn_col = next((c for c in df.columns if 'churn' in c.lower() or 'retention' in c.lower()), None)
    if churn_col:
        churn_risk = float(df[churn_col].mean() * 100)
        if churn_risk > 100: churn_risk = churn_risk / 100.0
    else:
        # Estimate proxy churn from monthly trend slope
        monthly_data = time_breakdowns.get('monthly', [])
        if len(monthly_data) >= 3:
            y = np.array([item['value'] for item in monthly_data]).reshape(-1, 1)
            x = np.arange(len(monthly_data)).reshape(-1, 1)
            model = LinearRegression()
            model.fit(x, y)
            slope = float(model.coef_[0, 0])
            mean_val = float(np.mean(y))
            if mean_val > 0:
                growth_index = slope / mean_val
                churn_risk = max(1.5, min(95.0, 12.5 - (growth_index * 100)))
            else:
                churn_risk = 15.0
        else:
            churn_risk = 12.5

    return {
        "forecasts": forecasts,
        "summaries": summaries,
        "churn_risk": round(churn_risk, 1)
    }
