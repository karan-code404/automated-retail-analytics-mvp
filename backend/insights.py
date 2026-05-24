import numpy as np

def generate_analyst_insights(kpis, breakdowns, correlations, domain):
    """
    Generate natural human-like analyst insights explaining:
    - What happened
    - Why it likely happened
    - Business impact
    - Severity (success, warning, critical, info)
    """
    insights = []
    
    # 1. Analyze Core KPIs
    kpi_dict = {k['title']: k for k in kpis}
    
    if domain == "sales":
        rev_kpi = kpi_dict.get("Total Revenue")
        profit_kpi = kpi_dict.get("Net Profit")
        margin_kpi = kpi_dict.get("Profit Margin")
        
        # Revenue trend insight
        if rev_kpi and rev_kpi['trend'] == 'up':
            insights.append({
                "title": "Strong Revenue Growth",
                "severity": "success",
                "what": f"Gross sales revenue increased by {rev_kpi['change']} during the second half of the reporting timeline.",
                "why": "Likely driven by higher customer demand, better checkout success rates, or popular product promotions.",
                "impact": "Improves overall cash flow and allows for higher marketing budgets in the next quarter."
            })
        elif rev_kpi and rev_kpi['trend'] == 'down':
            insights.append({
                "title": "Revenue Drop Warning",
                "severity": "critical",
                "what": f"Gross sales dropped by {rev_kpi['change']} across the latter half of the reporting period.",
                "why": "Likely due to shipping delays, payment page errors, or lower website traffic during peak shopping hours.",
                "impact": f"Estimated sales loss of approximately ₹{(rev_kpi['raw'] * 0.08):,.0f} if these issues are not resolved immediately."
            })
            
        # Margin compression insight
        if margin_kpi and margin_kpi['raw'] < 15.0:
            insights.append({
                "title": "Profit Margin Squeeze",
                "severity": "warning",
                "what": f"Net profit margin dropped to {margin_kpi['value']}.",
                "why": "Driven by rising costs to acquire customers, higher shipping fees, or deep promotional discounts.",
                "impact": "Reduces the actual profit made per sale, leaving less cash to reinvest back into the business."
            })
            
    elif domain == "marketing":
        cac_kpi = kpi_dict.get("Customer Acquisition Cost (CAC)")
        ctr_kpi = kpi_dict.get("Avg Click-Through Rate")
        leads_kpi = kpi_dict.get("Acquired Leads")
        
        if cac_kpi and cac_kpi['trend'] == 'up':
            insights.append({
                "title": "Rising Cost to Acquire Customers",
                "severity": "warning",
                "what": f"The cost to acquire a customer (CAC) rose by {cac_kpi['change']} over the campaign cycle.",
                "why": "Likely due to higher competition for ad keywords, targeting the wrong audience, or low ad relevance.",
                "impact": "Decreases marketing efficiency and makes it take longer to break even on advertising spend."
            })
        elif cac_kpi and cac_kpi['trend'] == 'down':
            insights.append({
                "title": "Improved Customer Inflow Costs",
                "severity": "success",
                "what": f"The average cost to acquire a customer declined by {cac_kpi['change']} to {cac_kpi['value']}.",
                "why": "Attributed to better ad targeting, improved copywriting, and filtering out non-converting search terms.",
                "impact": "Frees up marketing budget, allowing us to attract 15-20% more leads for the same cost."
            })
            
        if ctr_kpi and ctr_kpi['trend'] == 'down':
            insights.append({
                "title": "Lower Ad Click-Through Rates",
                "severity": "warning",
                "what": f"The percentage of people clicking on our ads dropped by {ctr_kpi['change']}.",
                "why": "Showing the same ads too many times to the same audience, making them less effective.",
                "impact": "Raises the cost per click, which increases overall marketing expenses."
            })
 
    elif domain == "customer":
        churn_kpi = kpi_dict.get("Customer Churn Rate")
        cltv_kpi = kpi_dict.get("Lifetime Value (CLTV)")
        
        if churn_kpi and churn_kpi['trend'] == 'up':
            insights.append({
                "title": "Rising Customer Churn Rate",
                "severity": "critical",
                "what": f"The customer churn rate rose by {churn_kpi['change']}.",
                "why": "Usually linked to customer onboarding difficulties, competitor price drops, or product issues.",
                "impact": "Leads to a continuous drop in monthly sales, which requires immediate retention efforts."
            })
        elif churn_kpi and churn_kpi['trend'] == 'down':
            insights.append({
                "title": "Retention Strategy Success",
                "severity": "success",
                "what": f"Customer churn dropped by {churn_kpi['change']} to a stable {churn_kpi['value']}.",
                "why": "Directly linked to proactive customer support and improved onboarding guides.",
                "impact": "Increases the lifetime value of our customers and stabilizes monthly revenue forecasts."
            })
 
    # 2. Analyze Category breakdowns for specific insights
    cat_data = breakdowns.get("category_breakdown", [])
    if isinstance(cat_data, dict):
        cat_data = cat_data.get("overall", [])
        
    if len(cat_data) > 0:
        top_cat = cat_data[0]
        insights.append({
            "title": f"Top Product Segment: {top_cat['name']}",
            "severity": "info",
            "what": f"The '{top_cat['name']}' category generated the largest volume of sales, yielding ₹{top_cat['value']:,.0f}.",
            "why": "High customer familiarity, strong search rankings, and limited local competition.",
            "impact": f"Accounts for {(top_cat['count'] / len(cat_data) * 100) if len(cat_data) > 0 else 25:.1f}% of total transactions. This represents a dependency if stock runs dry."
        })
        
    # 3. Analyze Correlations
    strong_corrs = [c for c in correlations if abs(c['value']) > 0.65 and c['x'] != c['y']]
    # Deduplicate x-y combinations
    seen_pairs = set()
    for corr in strong_corrs:
        pair = tuple(sorted([corr['x'], corr['y']]))
        if pair not in seen_pairs:
            seen_pairs.add(pair)
            relationship = "positive" if corr['value'] > 0 else "inverse"
            severity = "success" if corr['value'] > 0 else "warning"
            insights.append({
                "title": f"Strong Link Between Metrics: {corr['x']} & {corr['y']}",
                "severity": severity,
                "what": f"A strong {relationship} link of {corr['value']} was found between '{corr['x']}' and '{corr['y']}'.",
                "why": "These metrics share direct operational connections or common business drivers.",
                "impact": f"Shows that changing '{corr['x']}' will directly shift '{corr['y']}', allowing managers to plan ahead accurately."
            })
            
    # Fallback default insight
    if not insights:
        insights.append({
            "title": "Baseline Data Operations",
            "severity": "info",
            "what": "Initial statistical profile is steady with no sudden operational spikes.",
            "why": "Standard seasonal pattern and highly predictable workflow.",
            "impact": "No immediate critical actions required. Maintain standard operational procedures."
        })
        
    return insights
