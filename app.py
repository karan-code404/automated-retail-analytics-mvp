import os
import pandas as pd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Import backend modules
from backend.auth import register_user, login_user, logout_user, verify_token
from backend.cleaner import audit_dataset, clean_dataset
from backend.analyzer import detect_business_domain, compile_kpis, calculate_correlations, compile_breakdowns
from backend.insights import generate_analyst_insights
from backend.root_cause import perform_root_cause_analysis
from backend.forecaster import generate_time_forecast
from backend.recommendations import generate_business_recommendations
from backend.reporter import generate_pdf_report, generate_docx_report, generate_ppt_report
from backend.chatbot import answer_dataset_query

app = Flask(__name__)
CORS(app)

# Folders setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')
REPORTS_DIR = os.path.join(BASE_DIR, 'reports')

for folder in [UPLOADS_DIR, REPORTS_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

# Global configuration variables
ACTIVE_FILE_META = {
    "name": "No dataset loaded",
    "path": "",
    "cleaned": False
}

def get_active_df():
    """
    Helper to read active dataset from disk.
    """
    path = os.path.join(UPLOADS_DIR, 'active_dataset.csv')
    if not os.path.exists(path):
        return None
    try:
        return pd.read_csv(path)
    except Exception:
        return None

def save_active_df(df):
    """
    Helper to write active dataset to disk.
    """
    path = os.path.join(UPLOADS_DIR, 'active_dataset.csv')
    df.to_csv(path, index=False)

# ================= AUTH ENDPOINTS =================

@app.route('/api/auth/register', methods=['POST'])
def handle_register():
    data = request.json or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not username or not email or not password:
        return jsonify({"success": False, "error": "Username, email, and password are required."}), 400
        
    success, msg = register_user(username, email, password)
    if not success:
        return jsonify({"success": False, "error": msg}), 400
    return jsonify({"success": True, "message": msg})

@app.route('/api/auth/login', methods=['POST'])
def handle_login():
    data = request.json or {}
    username_or_email = data.get('username_or_email')
    password = data.get('password')
    
    if not username_or_email or not password:
        return jsonify({"success": False, "error": "Username/email and password are required."}), 400
        
    success, payload = login_user(username_or_email, password)
    if not success:
        return jsonify({"success": False, "error": payload}), 401
    return jsonify({"success": True, **payload})

@app.route('/api/auth/logout', methods=['POST'])
def handle_logout():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    if token:
        logout_user(token)
    return jsonify({"success": True, "message": "Logged out successfully."})

@app.route('/api/auth/session', methods=['GET'])
def handle_session():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    user_session = verify_token(token) if token else None
    if not user_session:
        return jsonify({"success": False, "error": "Unauthorized session."}), 401
    return jsonify({"success": True, "user": user_session})

# ================= DATASET UPLOAD & CLEANING =================

@app.route('/api/upload', methods=['POST'])
def handle_upload():
    # Verify Authorization token
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    if not verify_token(token):
        return jsonify({"success": False, "error": "Unauthorized session."}), 401

    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded."}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "Selected filename is empty."}), 400
        
    filename = secure_filename(file.filename)
    ext = filename.split('.')[-1].lower()
    
    if ext not in ['csv', 'xlsx', 'xls', 'json']:
        return jsonify({"success": False, "error": "Unsupported file format. Please upload CSV, Excel, or JSON."}), 400
        
    temp_path = os.path.join(UPLOADS_DIR, f"temp_{filename}")
    file.save(temp_path)
    
    try:
        # Load dataset with Pandas
        if ext == 'csv':
            df = pd.read_csv(temp_path)
        elif ext in ['xlsx', 'xls']:
            df = pd.read_excel(temp_path)
        else:
            df = pd.read_json(temp_path)
            
        # Standardize and save as internal active_dataset.csv
        save_active_df(df)
        
        ACTIVE_FILE_META["name"] = filename
        ACTIVE_FILE_META["path"] = temp_path
        ACTIVE_FILE_META["cleaned"] = False
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        audit = audit_dataset(df)
        return jsonify({
            "success": True, 
            "dataset_name": filename, 
            "cleaned": False, 
            "audit": audit
        })
        
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({"success": False, "error": f"Failed to parse file: {str(e)}"}), 500

@app.route('/api/clean', methods=['POST'])
def handle_clean():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    if not verify_token(token):
        return jsonify({"success": False, "error": "Unauthorized session."}), 401

    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded."}), 400
        
    settings = request.json or {}
    
    try:
        cleaned_df, clean_report = clean_dataset(df, settings)
        save_active_df(cleaned_df)
        ACTIVE_FILE_META["cleaned"] = True
        
        audit = audit_dataset(cleaned_df)
        return jsonify({
            "success": True,
            "logs": clean_report["logs"],
            "report": clean_report,
            "audit": audit
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Cleaning engine error: {str(e)}"}), 500

# ================= ANALYTICS DASHBOARD =================

@app.route('/api/dashboard', methods=['GET'])
def handle_dashboard():
    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded."}), 400
        
    try:
        domain = detect_business_domain(df)
        kpis = compile_kpis(df, domain)
        correlations = calculate_correlations(df)
        breakdowns = compile_breakdowns(df, domain)
        
        return jsonify({
            "success": True,
            "domain": domain,
            "kpis": kpis,
            "correlations": correlations,
            **breakdowns
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Analytics engine error: {str(e)}"}), 500

@app.route('/api/insights', methods=['GET'])
def handle_insights():
    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded."}), 400
        
    try:
        domain = detect_business_domain(df)
        kpis = compile_kpis(df, domain)
        breakdowns = compile_breakdowns(df, domain)
        correlations = calculate_correlations(df)
        
        insights = generate_analyst_insights(kpis, breakdowns, correlations, domain)
        hypotheses = perform_root_cause_analysis(df, domain, breakdowns)
        
        return jsonify({
            "success": True,
            "insights": insights,
            "hypotheses": hypotheses
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Insights engine error: {str(e)}"}), 500

@app.route('/api/forecast', methods=['GET'])
def handle_forecast():
    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded."}), 400
        
    try:
        domain = detect_business_domain(df)
        breakdowns = compile_breakdowns(df, domain)
        forecast = generate_time_forecast(df, breakdowns, domain)
        
        return jsonify({
            "success": True,
            **forecast
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Forecasting engine error: {str(e)}"}), 500

@app.route('/api/recommendations', methods=['GET'])
def handle_recommendations():
    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded."}), 400
        
    try:
        domain = detect_business_domain(df)
        kpis = compile_kpis(df, domain)
        breakdowns = compile_breakdowns(df, domain)
        hypotheses = perform_root_cause_analysis(df, domain, breakdowns)
        
        recs = generate_business_recommendations(df, kpis, hypotheses, domain)
        return jsonify({
            "success": True,
            "recommendations": recs
        })
    except Exception as e:
        return jsonify({"success": False, "error": f"Recommendations engine error: {str(e)}"}), 500

# ================= CHATBOT ASSISTANT =================

@app.route('/api/chatbot', methods=['POST'])
def handle_chatbot():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    if not verify_token(token):
        return jsonify({"success": False, "error": "Unauthorized session."}), 401

    data = request.json or {}
    message = data.get('message')
    if not message:
        return jsonify({"success": False, "error": "Message is required."}), 400
        
    df = get_active_df()
    if df is None:
        return jsonify({
            "success": True, 
            "reply": "I don't have a dataset context loaded yet. Please navigate to the **Upload Dataset** page and upload a file first, so I can analyze it and answer your questions!"
        })
        
    try:
        audit_results = audit_dataset(df)
        domain = detect_business_domain(df)
        kpis = compile_kpis(df, domain)
        breakdowns = compile_breakdowns(df, domain)
        correlations = calculate_correlations(df)
        insights = generate_analyst_insights(kpis, breakdowns, correlations, domain)
        hypotheses = perform_root_cause_analysis(df, domain, breakdowns)
        forecast = generate_time_forecast(df, breakdowns, domain)
        recs = generate_business_recommendations(df, kpis, hypotheses, domain)
        
        # Combine breakdowns for chatbot helper
        audit_results["category_breakdown"] = breakdowns["category_breakdown"]
        
        reply = answer_dataset_query(message, audit_results, kpis, insights, hypotheses, recs, forecast, domain)
        return jsonify({"success": True, "reply": reply})
    except Exception as e:
        return jsonify({"success": False, "error": f"Chatbot engine error: {str(e)}"}), 500

# ================= REPORT COMPILER EXPORTS =================

@app.route('/api/export', methods=['POST'])
def handle_export():
    token = request.headers.get('Authorization')
    if token and token.startswith('Bearer '):
        token = token.split(' ')[1]
    user_session = verify_token(token) if token else None
    if not user_session:
        return jsonify({"success": False, "error": "Unauthorized session."}), 401

    df = get_active_df()
    if df is None:
        return jsonify({"success": False, "error": "No dataset loaded to export."}), 400
        
    data = request.json or {}
    file_format = data.get('format', 'pdf').lower()
    
    if file_format not in ['pdf', 'docx', 'pptx', 'pack']:
        return jsonify({"success": False, "error": "Unsupported export format. Use pdf, docx, pptx, or pack."}), 400
        
    try:
        domain = detect_business_domain(df)
        kpis = compile_kpis(df, domain)
        breakdowns = compile_breakdowns(df, domain)
        correlations = calculate_correlations(df)
        insights = generate_analyst_insights(kpis, breakdowns, correlations, domain)
        hypotheses = perform_root_cause_analysis(df, domain, breakdowns)
        forecast = generate_time_forecast(df, breakdowns, domain)
        recs = generate_business_recommendations(df, kpis, hypotheses, domain)
        
        dataset_name = ACTIVE_FILE_META.get("name", "dataset.csv")
        username = user_session.get("username", "Guest User")
        
        if file_format == 'pdf':
            file_path = generate_pdf_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            mime = 'application/pdf'
        elif file_format == 'docx':
            file_path = generate_docx_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        elif file_format == 'pptx':
            file_path = generate_ppt_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        else: # pack
            pdf_path = generate_pdf_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            docx_path = generate_docx_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            pptx_path = generate_ppt_report(dataset_name, kpis, breakdowns, correlations, insights, hypotheses, recs, forecast, username)
            
            import zipfile
            zip_filename = f"consulting_pack_{dataset_name.split('.')[0]}_{os.getpid()}.zip"
            zip_path = os.path.join(REPORTS_DIR, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                zipf.write(pdf_path, arcname=os.path.basename(pdf_path))
                zipf.write(docx_path, arcname=os.path.basename(docx_path))
                zipf.write(pptx_path, arcname=os.path.basename(pptx_path))
                
            mime = 'application/zip'
            return send_file(zip_path, as_attachment=True, mimetype=mime, download_name=zip_filename)
            
        return send_file(file_path, as_attachment=True, mimetype=mime, download_name=os.path.basename(file_path))
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Report exporter error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
