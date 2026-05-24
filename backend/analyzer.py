import pandas as pd
import numpy as np

def detect_business_domain(df):
    """
    Auto-detect the business domain based on column header names.
    """
    cols = [col.lower() for col in df.columns]
    
    # Domain tokens
    sales_tokens = ['sale', 'revenue', 'profit', 'price', 'quantity', 'amount', 'order', 'cost_price', 'selling_price']
    marketing_tokens = ['ctr', 'cac', 'click', 'conversion', 'impression', 'spend', 'lead', 'ad_', 'cpc', 'cpm']
    customer_tokens = ['churn', 'retention', 'cltv', 'customer', 'tenure', 'subscribe', 'user', 'active', 'satisfaction', 'nps']
    
    sales_score = sum(1 for tok in sales_tokens if any(tok in col for col in cols))
    marketing_score = sum(1 for tok in marketing_tokens if any(tok in col for col in cols))
    customer_score = sum(1 for tok in customer_tokens if any(tok in col for col in cols))
    
    scores = {
        "sales": sales_score,
        "marketing": marketing_score,
        "customer": customer_score
    }
    
    max_domain = max(scores, key=scores.get)
    if scores[max_domain] == 0:
        return "generic"
    return max_domain

def compile_kpis(df, domain):
    """
    Calculate business KPIs based on detected domain with trend indicators.
    """
    cols = [col.lower() for col in df.columns]
    col_mapping = {col.lower(): col for col in df.columns}
    kpis = []
    
    # Helper to calculate trend
    def calculate_trend_indicator(column_name):
        try:
            if column_name not in df.columns:
                return "neutral", 0.0
            col_data = df[column_name].dropna()
            if len(col_data) < 2:
                return "neutral", 0.0
            half = len(col_data) // 2
            first_half = col_data.iloc[:half].mean()
            second_half = col_data.iloc[half:].mean()
            if first_half == 0:
                return "neutral", 0.0
            pct_change = ((second_half - first_half) / first_half) * 100
            
            if pct_change > 1.5:
                return "up", float(pct_change)
            elif pct_change < -1.5:
                return "down", float(pct_change)
            return "neutral", float(pct_change)
        except Exception:
            return "neutral", 0.0

    if domain == "sales":
        rev_col = next((col_mapping[c] for c in cols if 'revenue' in c or 'sales_amount' in c or ('sales' in c and 'amount' in c)), None)
        if not rev_col:
            price_col = next((col_mapping[c] for c in cols if 'price' in c or 'rate' in c), None)
            qty_col = next((col_mapping[c] for c in cols if 'qty' in c or 'quantity' in c or 'amount' in c), None)
            if price_col and qty_col:
                df['Calculated_Revenue'] = df[price_col] * df[qty_col]
                rev_col = 'Calculated_Revenue'
        
        profit_col = next((col_mapping[c] for c in cols if 'profit' in c or 'margin' in c), None)
        if not profit_col and rev_col:
            cost_col = next((col_mapping[c] for c in cols if 'cost' in c), None)
            if cost_col:
                df['Calculated_Profit'] = df[rev_col] - df[cost_col]
                profit_col = 'Calculated_Profit'
                
        units_col = next((col_mapping[c] for c in cols if 'qty' in c or 'quantity' in c or 'sales_amount' in c or 'units' in c), None)
        
        total_revenue = float(df[rev_col].sum()) if rev_col else 0.0
        total_profit = float(df[profit_col].sum()) if profit_col else 0.0
        total_items = int(df[units_col].sum()) if units_col else 0
        
        aov = float(df[rev_col].mean()) if rev_col else 0.0
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0.0
        
        trend_dir_rev, trend_val_rev = calculate_trend_indicator(rev_col) if rev_col else ("neutral", 0.0)
        trend_dir_prof, trend_val_prof = calculate_trend_indicator(profit_col) if profit_col else ("neutral", 0.0)
        trend_dir_items, trend_val_items = calculate_trend_indicator(units_col) if units_col else ("neutral", 0.0)
        
        kpis = [
            {"title": "Total Revenue", "value": f"₹{total_revenue:,.0f}", "raw": total_revenue, "trend": trend_dir_rev, "change": f"{trend_val_rev:+.1f}%", "badge": "Gross Sales"},
            {"title": "Net Profit", "value": f"₹{total_profit:,.0f}", "raw": total_profit, "trend": trend_dir_prof, "change": f"{trend_val_prof:+.1f}%", "badge": "Net Earnings"},
            {"title": "Items Sold", "value": f"{total_items:,}", "raw": total_items, "trend": trend_dir_items, "change": f"{trend_val_items:+.1f}%", "badge": "Volume"},
            {"title": "Profit Margin", "value": f"{profit_margin:.1f}%", "raw": profit_margin, "trend": "neutral", "change": "", "badge": "Profitability"}
        ]
        
    elif domain == "marketing":
        cac_col = next((col_mapping[c] for c in cols if 'cac' in c or 'acquisition' in c), None)
        ctr_col = next((col_mapping[c] for c in cols if 'ctr' in c or 'click' in c), None)
        conv_col = next((col_mapping[c] for c in cols if 'conversion' in c or 'conv_rate' in c), None)
        spend_col = next((col_mapping[c] for c in cols if 'spend' in c or 'cost' in c or 'budget' in c), None)
        leads_col = next((col_mapping[c] for c in cols if 'lead' in c or 'signup' in c or 'acquisition' in c), None)
        
        avg_ctr = float(df[ctr_col].mean()) if ctr_col else 0.15
        if avg_ctr > 1.0: avg_ctr = avg_ctr / 100.0
        
        avg_cac = float(df[cac_col].mean()) if cac_col else (float(df[spend_col].sum() / df[leads_col].sum()) if spend_col and leads_col and df[leads_col].sum() > 0 else 250.0)
        conv_rate = float(df[conv_col].mean()) if conv_col else 2.5
        if conv_rate > 1.0: conv_rate = conv_rate / 100.0
        
        total_spend = float(df[spend_col].sum()) if spend_col else 0.0
        total_leads = int(df[leads_col].sum()) if leads_col else int(df.shape[0])
        
        trend_dir_cac, trend_val_cac = calculate_trend_indicator(cac_col) if cac_col else ("neutral", 0.0)
        trend_dir_ctr, trend_val_ctr = calculate_trend_indicator(ctr_col) if ctr_col else ("neutral", 0.0)
        trend_dir_leads, trend_val_leads = calculate_trend_indicator(leads_col) if leads_col else ("neutral", 0.0)
        
        kpis = [
            {"title": "Ad Spend", "value": f"₹{total_spend:,.0f}", "raw": total_spend, "trend": "neutral", "change": "", "badge": "Budget Spent"},
            {"title": "Acquired Leads", "value": f"{total_leads:,}", "raw": total_leads, "trend": trend_dir_leads, "change": f"{trend_val_leads:+.1f}%", "badge": "Lead Generation"},
            {"title": "Customer Acq. Cost (CAC)", "value": f"₹{avg_cac:,.1f}", "raw": avg_cac, "trend": trend_dir_cac, "change": f"{trend_val_cac:+.1f}%", "badge": "Cost Efficiency"},
            {"title": "Avg Click-Through Rate", "value": f"{avg_ctr * 100:.2f}%", "raw": avg_ctr, "trend": trend_dir_ctr, "change": f"{trend_val_ctr:+.1f}%", "badge": "CTR"}
        ]
        
    elif domain == "customer":
        churn_col = next((col_mapping[c] for c in cols if 'churn' in c or 'dropout' in c or 'attrition' in c), None)
        cltv_col = next((col_mapping[c] for c in cols if 'cltv' in c or 'lifetime' in c or 'value' in c), None)
        tenure_col = next((col_mapping[c] for c in cols if 'tenure' in c or 'months' in c or 'duration' in c), None)
        active_col = next((col_mapping[c] for c in cols if 'active' in c or 'status' in c), None)
        
        churn_rate = float(df[churn_col].mean()) if churn_col else 0.05
        if churn_rate > 1.0: churn_rate = churn_rate / 100.0
        
        avg_cltv = float(df[cltv_col].mean()) if cltv_col else 15000.0
        avg_tenure = float(df[tenure_col].mean()) if tenure_col else 24.5
        
        total_customers = int(df.shape[0])
        active_customers = int(df[df[active_col] == 1].shape[0]) if active_col else int(total_customers * (1.0 - churn_rate))
        
        trend_dir_churn, trend_val_churn = calculate_trend_indicator(churn_col) if churn_col else ("neutral", 0.0)
        trend_dir_cltv, trend_val_cltv = calculate_trend_indicator(cltv_col) if cltv_col else ("neutral", 0.0)
        
        kpis = [
            {"title": "Total Customers", "value": f"{total_customers:,}", "raw": total_customers, "trend": "neutral", "change": "", "badge": "Subscriber Base"},
            {"title": "Active Customers", "value": f"{active_customers:,}", "raw": active_customers, "trend": "up", "change": "", "badge": "Active Accounts"},
            {"title": "Customer Churn Rate", "value": f"{churn_rate * 100:.1f}%", "raw": churn_rate, "trend": trend_dir_churn, "change": f"{trend_val_churn:+.1f}%", "badge": "Attrition"},
            {"title": "Lifetime Value (CLTV)", "value": f"₹{avg_cltv:,.0f}", "raw": avg_cltv, "trend": trend_dir_cltv, "change": f"{trend_val_cltv:+.1f}%", "badge": "LTV Value"}
        ]
        
    else:
        numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        total_rows = int(df.shape[0])
        total_cols = int(df.shape[1])
        
        kpis = [
            {"title": "Total Rows", "value": f"{total_rows:,}", "raw": total_rows, "trend": "neutral", "change": "", "badge": "Data Rows"},
            {"title": "Total Columns", "value": f"{total_cols}", "raw": total_cols, "trend": "neutral", "change": "", "badge": "Features"},
        ]
        for col in numeric_cols[:2]:
            mean_val = float(df[col].mean())
            trend_dir, trend_val = calculate_trend_indicator(col)
            kpis.append({
                "title": f"Average {col.replace('_', ' ').title()}",
                "value": f"{mean_val:,.1f}",
                "raw": mean_val,
                "trend": trend_dir,
                "change": f"{trend_val:+.1f}%",
                "badge": "Average"
            })
            
    return kpis

def calculate_correlations(df):
    """
    Calculate Pearson correlation matrix formatted for Recharts Heatmap grid.
    """
    numeric_df = df.select_dtypes(include=[np.number])
    if numeric_df.shape[1] < 2:
        return []
        
    corr_matrix = numeric_df.corr().fillna(0)
    recharts_corr = []
    
    for i, col_x in enumerate(corr_matrix.columns):
        for j, col_y in enumerate(corr_matrix.columns):
            recharts_corr.append({
                "x": col_x,
                "y": col_y,
                "value": round(float(corr_matrix.iloc[i, j]), 2)
            })
            
    return recharts_corr

def compile_breakdowns(df, domain):
    """
    Generate multi-scale charts-ready breakdown lists for category and time.
    """
    cols = [col.lower() for col in df.columns]
    col_mapping = {col.lower(): col for col in df.columns}
    
    date_col = next((col_mapping[c] for c in cols if 'date' in c or 'time' in c or 'year' in c or 'month' in c), None)
    
    cat_col = next((col_mapping[c] for c in cols if 'category' in c or 'product' in c or 'segment' in c or 'group' in c or 'location' in c or 'region' in c), None)
    if not cat_col:
        str_cols = [col for col in df.columns if pd.api.types.is_string_dtype(df[col]) or str(df[col].dtype) == 'object']
        if str_cols:
            cat_col = str_cols[0]
            
    metric_col = None
    if domain == "sales":
        metric_col = next((col_mapping[c] for c in cols if 'revenue' in c or 'sales_amount' in c or 'profit' in c), None)
    elif domain == "marketing":
        metric_col = next((col_mapping[c] for c in cols if 'ctr' in c or 'spend' in c or 'clicks' in c or 'conversion' in c or 'leads' in c), None)
    elif domain == "customer":
        metric_col = next((col_mapping[c] for c in cols if 'churn' in c or 'cltv' in c or 'tenure' in c), None)
        
    if not metric_col:
        numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        if numeric_cols:
            metric_col = numeric_cols[0]

    # Calculate overall Category Breakdown
    cat_breakdown_overall = []
    if cat_col and metric_col:
        group_df = df.groupby(cat_col).agg(
            value=(metric_col, 'sum' if domain in ['sales', 'marketing'] and 'rate' not in metric_col.lower() else 'mean'),
            count=(df.columns[0], 'count')
        ).reset_index().sort_values(by='value', ascending=False)
        
        for _, row in group_df.head(10).iterrows():
            cat_breakdown_overall.append({
                "name": str(row[cat_col]),
                "value": round(float(row['value']), 2),
                "count": int(row['count'])
            })

    # Timeline & category calculations across multi-scales
    time_breakdown_daily = []
    time_breakdown_weekly = []
    time_breakdown_monthly = []
    time_breakdown_yearly = []

    category_breakdown_weekly = []
    category_breakdown_monthly = []
    category_breakdown_yearly = []

    if date_col and metric_col:
        df_temp = df.copy()
        df_temp['Parsed_Date'] = pd.to_datetime(df_temp[date_col], errors='coerce')
        df_temp = df_temp.dropna(subset=['Parsed_Date'])
        
        if not df_temp.empty:
            # Add time indicators
            df_temp['Day'] = df_temp['Parsed_Date'].dt.strftime('%Y-%m-%d')
            df_temp['Week_Start'] = df_temp['Parsed_Date'].dt.to_period('W').dt.start_time.dt.strftime('%Y-%m-%d')
            df_temp['Month'] = df_temp['Parsed_Date'].dt.strftime('%Y-%m')
            df_temp['Year'] = df_temp['Parsed_Date'].dt.strftime('%Y')
            
            agg_func = 'sum' if domain in ['sales', 'marketing'] and 'rate' not in metric_col.lower() else 'mean'

            # 1. Timeline Trends
            # Daily
            time_df_d = df_temp.groupby('Day').agg(value=(metric_col, agg_func)).reset_index().sort_values('Day')
            time_breakdown_daily = [{"date": row['Day'], "value": round(float(row['value']), 2)} for _, row in time_df_d.iterrows()]
            
            # Weekly
            time_df_w = df_temp.groupby('Week_Start').agg(value=(metric_col, agg_func)).reset_index().sort_values('Week_Start')
            time_breakdown_weekly = [{"date": row['Week_Start'], "value": round(float(row['value']), 2)} for _, row in time_df_w.iterrows()]
            
            # Monthly
            time_df_m = df_temp.groupby('Month').agg(value=(metric_col, agg_func)).reset_index().sort_values('Month')
            time_breakdown_monthly = [{"date": row['Month'], "value": round(float(row['value']), 2)} for _, row in time_df_m.iterrows()]
            
            # Yearly
            time_df_y = df_temp.groupby('Year').agg(value=(metric_col, agg_func)).reset_index().sort_values('Year')
            time_breakdown_yearly = [{"date": row['Year'], "value": round(float(row['value']), 2)} for _, row in time_df_y.iterrows()]

            # 2. Multi-Scale Category Breakdowns
            if cat_col:
                # Weekly Category Breakdown
                cat_w = df_temp.groupby(['Week_Start', cat_col]).agg(
                    total_sales=(metric_col, agg_func),
                    units_sold=(df_temp.columns[0], 'count')
                ).reset_index().rename(columns={'Week_Start': 'period', cat_col: 'Category'})
                category_breakdown_weekly = cat_w.to_dict(orient='records')

                # Monthly Category Breakdown
                cat_m = df_temp.groupby(['Month', cat_col]).agg(
                    total_sales=(metric_col, agg_func),
                    units_sold=(df_temp.columns[0], 'count')
                ).reset_index().rename(columns={'Month': 'period', cat_col: 'Category'})
                category_breakdown_monthly = cat_m.to_dict(orient='records')

                # Yearly Category Breakdown
                cat_y = df_temp.groupby(['Year', cat_col]).agg(
                    total_sales=(metric_col, agg_func),
                    units_sold=(df_temp.columns[0], 'count')
                ).reset_index().rename(columns={'Year': 'period', cat_col: 'Category'})
                category_breakdown_yearly = cat_y.to_dict(orient='records')

    # Fallback to overall counts if dates do not exist
    if not time_breakdown_monthly and metric_col:
        # Fallback dummy indices
        time_breakdown_monthly = [{"date": f"Period {i+1}", "value": float(val)} for i, val in enumerate(df[metric_col].head(10).fillna(0))]
        time_breakdown_daily = time_breakdown_monthly
        time_breakdown_weekly = time_breakdown_monthly
        time_breakdown_yearly = time_breakdown_monthly

    loc_col = next((col_mapping[c] for c in cols if 'location' in c or 'region' in c or 'country' in c or 'city' in c or 'state' in c), None)
    loc_breakdown = []
    if loc_col and metric_col:
        loc_df = df.groupby(loc_col).agg(
            value=(metric_col, 'sum' if domain in ['sales', 'marketing'] and 'rate' not in metric_col.lower() else 'mean')
        ).reset_index().sort_values(by='value', ascending=False)
        
        for _, row in loc_df.head(8).iterrows():
            loc_breakdown.append({
                "region": str(row[loc_col]),
                "value": round(float(row['value']), 2)
            })

    return {
        "category_column": cat_col,
        "date_column": date_col,
        "metric_column": metric_col,
        "location_column": loc_col,
        "category_breakdown": {
            "overall": cat_breakdown_overall,
            "weekly": category_breakdown_weekly,
            "monthly": category_breakdown_monthly,
            "yearly": category_breakdown_yearly
        },
        "time_breakdowns": {
            "daily": time_breakdown_daily,
            "weekly": time_breakdown_weekly,
            "monthly": time_breakdown_monthly,
            "yearly": time_breakdown_yearly
        },
        "location_breakdown": loc_breakdown
    }
