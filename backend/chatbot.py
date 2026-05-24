def answer_dataset_query(question, audit_results, kpis, insights, hypotheses, recommendations, forecast, domain):
    """
    Simulate a context-aware analytics assistant.
    Reads dataset metrics, quality reports, hypotheses, and answers user queries.
    """
    q = question.lower()
    
    # 1. Handle Churn, Drop, Decline, Volatility
    if any(k in q for k in ['drop', 'decline', 'decrease', 'churn', 'fall', 'loss', 'volatility', 'bad', 'wrong']):
        # Find critical/warning insights or segment hypotheses
        critical_items = [ins for ins in insights if ins['severity'] in ['critical', 'warning']]
        segment_items = [h for h in hypotheses if 'Segment' in h['title']]
        
        reply = "### Operational Variance Diagnostics\n\n"
        if segment_items:
            reply += f"Our **Root Cause Analysis Engine** identified segment variance driving the deviation:\n"
            for h in segment_items:
                reply += f"- **{h['title']}** (Confidence: {h['confidence']}%):\n  *Hypothesis:* {h['hypothesis']}\n  *Evidence:* {h['evidence']}\n\n"
        
        if critical_items:
            reply += "Additionally, our **AI Analyst Feed** flagged the following alerts:\n"
            for ins in critical_items:
                reply += f"- **{ins['title']}**:\n  *What Happened:* {ins['what']}\n  *Underlying Cause:* {ins['why']}\n  *Business Impact:* {ins['impact']}\n\n"
                
        if not critical_items and not segment_items:
            reply += "There are no major negative anomalies or performance drops detected in this dataset. The historical values show stable fluctuations within statistical boundaries."
            
        return reply

    # 2. Handle Best performers, Top products, Leading segments
    if any(k in q for k in ['best', 'top', 'highest', 'max', 'lead', 'popular', 'performing', 'winner']):
        reply = "### Top-Performance Analysis\n\n"
        
        # Categorical top performer
        cat_breakdown = audit_results.get("category_breakdown", [])
        if isinstance(cat_breakdown, dict):
            cat_breakdown = cat_breakdown.get("overall", [])
            
        if cat_breakdown:
            top_cat = cat_breakdown[0]
            reply += f"The leading category by volume is **{top_cat['name']}**, contributing a total value of **₹{top_cat['value']:,.2f}** over **{top_cat['count']}** records.\n\n"
            
        # KPI checks
        kpi_dict = {k['title']: k for k in kpis}
        rev_kpi = kpi_dict.get("Total Revenue")
        profit_kpi = kpi_dict.get("Net Profit")
        
        if rev_kpi or profit_kpi:
            reply += "**Key Performance Highpoints:**\n"
            if rev_kpi:
                reply += f"- **Total Revenue**: {rev_kpi['value']} (Trend: {rev_kpi['change'] if rev_kpi['change'] else 'Stable'})\n"
            if profit_kpi:
                reply += f"- **Net Operating Profit**: {profit_kpi['value']} (Velocity: {profit_kpi['change'] if profit_kpi['change'] else 'Stable'})\n"
                
        return reply

    # 3. Handle Forecast, Future, Predictions
    if any(k in q for k in ['forecast', 'future', 'predict', 'projection', 'trend', 'next', 'direction']):
        summary_desc = forecast.get("forecast_summary", "")
        risk = forecast.get("churn_risk", 0.0)
        
        reply = "### Predictive Trend Projections\n\n"
        reply += f"**Model Insights:** {summary_desc}\n\n"
        reply += f"- **Customer / Account Attrition Risk (Proxy Churn):** `{risk}%` Probability\n"
        reply += f"- **Forecast Window:** 6 upcoming periods calculated via Linear Regression using residual least-squares error.\n\n"
        reply += "You can view the full forecast curve and confidence boundaries under the **Forecasting** page in the sidebar."
        return reply

    # 4. Handle Recommendations, Actions, Strategy
    if any(k in q for k in ['recommendation', 'action', 'do', 'strategy', 'solve', 'fix', 'improvement', 'roi']):
        reply = "### Strategic Directives & Action Plan\n\n"
        reply += "Here are the top actionable recommendations generated for your business:\n\n"
        
        for idx, rec in enumerate(recommendations):
            reply += f"{idx+1}. **{rec['action']}** (Priority: **{rec['priority']}** | Complexity: `{rec['complexity']}`)\n"
            reply += f"   - *Rationale:* {rec['reason']}\n"
            reply += f"   - *Expected Impact:* {rec['impact']} (Projected ROI: **{rec['roi']}**)\n\n"
            
        return reply

    # 5. Handle Data Cleaning, Quality, Duplicates, Nulls
    if any(k in q for k in ['clean', 'quality', 'missing', 'null', 'duplicate', 'outlier', 'rows', 'columns', 'format']):
        reply = "### Dataset Quality Audit & Cleaning Log\n\n"
        reply += f"- **Total Dimensions:** {audit_results.get('rows_count')} rows × {audit_results.get('columns_count')} columns.\n"
        reply += f"- **Missing Data fields:** {audit_results.get('missing_count')} null cells detected.\n"
        reply += f"- **Duplicate Records:** {audit_results.get('duplicate_rows')} matching rows found.\n\n"
        reply += "**Cleaning Protocol Applied:**\n"
        reply += "1. Removed all duplicate entries.\n"
        reply += "2. Filled missing numeric entries using column median value.\n"
        reply += "3. Standardized text casing and stripped padding spaces.\n"
        reply += "4. Outliers clipped within IQR boundary thresholds to maintain model stability."
        return reply

    # 6. Fallback General Summary
    kpi_summary = ", ".join([f"{k['title']}: **{k['value']}**" for k in kpis[:3]])
    reply = f"### Dataset Context Profile\n\n"
    reply += f"I have loaded your **{domain.upper()}** dataset. Here is a summary of our findings:\n\n"
    reply += f"- **Calculated KPIs:** {kpi_summary}.\n"
    reply += f"- **Operational Health:** The data contains {audit_results.get('rows_count')} records and {audit_results.get('columns_count')} columns.\n\n"
    reply += "What specific area would you like to investigate? I can explain drops, segment correlations, forecast regression models, or suggest marketing improvements."
    
    return reply
