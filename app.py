import streamlit as st
import pandas as pd

# Page configuration
st.set_page_config(page_title="Retail Analytics App", layout="wide")

# App Title
st.title("📊 Automated Retail & Sales Analytics Tool")
st.write("Upload your sales data to generate instant insights and recommendations.")

# Step 1: File Uploader Component
uploaded_file = st.file_uploader("Upload your CSV file here (Ensure standard template format)", type=['csv'])

if uploaded_file is not None:
    # Read the data using Pandas
    df = pd.read_csv(uploaded_file)
    
    st.success("File uploaded successfully!")
    
    # Display the raw data
    st.subheader("Preview of Uploaded Data")
    st.dataframe(df.head())
    
    # Basic Summary
    st.subheader("Data Summary")
    st.write(f"**Total Rows:** {df.shape[0]}")
    st.write(f"**Total Columns:** {df.shape[1]}")

    # --- YAHAN SE NAYA CODE ADD KARNA HAI ---
    
    # 1. Profit Calculation logic
    # Profit = (Selling Price - Cost Price) * Sales Amount
    df['Profit'] = (df['Selling_Price'] - df['Cost_Price']) * df['Sales_Amount']
    
    st.markdown("---")
    st.header("📈 Key Performance Indicators (KPIs)")
    
    # Display Top Metrics (Business impact show karne ke liye)
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(label="Total Items Sold", value=int(df['Sales_Amount'].sum()))
    with col2:
        total_revenue = (df['Selling_Price'] * df['Sales_Amount']).sum()
        st.metric(label="Total Revenue", value=f"₹{int(total_revenue)}")
    with col3:
        st.metric(label="Total Profit generated", value=f"₹{int(df['Profit'].sum())}")
        
    st.markdown("---")
    st.header("📊 Interactive Visualizations")
    
    # 2. Product-wise Profit Chart using Plotly
    import plotly.express as px
    
    # Data ko Product ke hisaab se group karna
    profit_by_product = df.groupby('Product')['Profit'].sum().reset_index()
    
    # Bar Chart banana
    fig_profit = px.bar(profit_by_product, x='Product', y='Profit', 
                        title="Total Profit Contribution by Product",
                        color='Profit', 
                        color_continuous_scale='Blues')
    
    # Streamlit mein chart display karna
    st.plotly_chart(fig_profit, use_container_width=True)

    # --- YAHAN SE NAYA CODE ADD KARNA HAI ---
    
    st.markdown("---")
    st.header("📈 Sales Trend Analysis")
    
    # 3. Time-Series Chart (Sales over time)
    # Date column ko sahi format mein laana
    df['Date'] = pd.to_datetime(df['Date'])
    sales_trend = df.groupby('Date')['Sales_Amount'].sum().reset_index()
    
    # Line Chart banana
    fig_trend = px.line(sales_trend, x='Date', y='Sales_Amount', 
                        title="Overall Sales Trend Over Time", 
                        markers=True, line_shape="spline")
    
    st.plotly_chart(fig_trend, use_container_width=True)
    
    st.markdown("---")
    st.header("💡 Smart Business Recommendations")
    
    # 4. Actionable Insights (Tumhara Business Logic)
    col_rec1, col_rec2 = st.columns(2)
    
    with col_rec1:
        st.info("🔥 **High Demand Strategy (Volume Boost)**")
        # Sabse zyada profit dene wala product nikalna
        best_product = profit_by_product.sort_values(by='Profit', ascending=False).iloc[0]['Product']
        st.write(f"**Data Insight:** **{best_product}** is your top-performing product!")
        st.write("**Action:** Consider offering a 5-10% promotional discount to maximize sales volume and beat competitors.")
        
    with col_rec2:
        st.warning("⚠️ **Dead Stock Strategy (Clearance)**")
        # Sabse kam profit dene wala product nikalna
        worst_product = profit_by_product.sort_values(by='Profit', ascending=True).iloc[0]['Product']
        st.write(f"**Data Insight:** **{worst_product}** is generating the lowest profit.")
        st.write("**Action:** Apply a heavy discount (20-30%) to clear this stock and free up valuable warehouse space.")
    
else:
    st.info("Awaiting file upload. Please upload a CSV file to proceed.")