import pandas as pd
import numpy as np

def audit_dataset(df):
    """
    Perform a complete profile audit of the dataset.
    """
    rows_count, cols_count = df.shape
    duplicate_rows = int(df.duplicated().sum())
    
    # Missing values per column
    missing_by_col = df.isnull().sum().to_dict()
    missing_count = int(df.isnull().sum().sum())
    
    # Column datatypes details
    col_types = {}
    for col in df.columns:
        col_types[col] = str(df[col].dtype)
        
    # First 20 rows preview (convert to json-friendly records)
    preview = df.head(20).fillna('').to_dict(orient='records')
    
    # Identify numerical columns for statistical analytics
    numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
    
    # Detect outliers count per numeric column using IQR
    outlier_counts = {}
    for col in numeric_cols:
        col_data = df[col].dropna()
        if len(col_data) > 0:
            q1 = col_data.quantile(0.25)
            q3 = col_data.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outliers = col_data[(col_data < lower_bound) | (col_data > upper_bound)]
            outlier_counts[col] = int(len(outliers))
        else:
            outlier_counts[col] = 0
            
    return {
        "rows_count": rows_count,
        "columns_count": cols_count,
        "duplicate_rows": duplicate_rows,
        "missing_count": missing_count,
        "missing_by_column": missing_by_col,
        "data_types": col_types,
        "outlier_counts": outlier_counts,
        "preview": preview,
        "numeric_columns": numeric_cols,
        "columns_list": list(df.columns)
    }

def clean_dataset(df, settings=None):
    """
    Automatically or custom clean the dataset.
    """
    if settings is None:
        settings = {
            "fill_missing": True,
            "remove_duplicates": True,
            "handle_outliers": "clip", # 'clip', 'remove', 'keep'
            "normalize_strings": True,
            "standardize_headers": True
        }
        
    summary_logs = []
    initial_rows = len(df)
    
    # 1. Standardize Headers
    if settings.get("standardize_headers"):
        original_cols = list(df.columns)
        # Strip spaces and convert special characters
        df.columns = [col.strip().replace(' ', '_').replace('.', '_') for col in df.columns]
        changed_cols = [f"{orig} -> {new}" for orig, new in zip(original_cols, df.columns) if orig != new]
        if changed_cols:
            summary_logs.append(f"Standardized column headers: {', '.join(changed_cols[:3])}...")
            
    # 2. Remove Duplicates
    duplicates_removed = 0
    if settings.get("remove_duplicates"):
        before_dup = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        duplicates_removed = before_dup - len(df)
        if duplicates_removed > 0:
            summary_logs.append(f"Removed {duplicates_removed} duplicate row(s).")
            
    # 3. Handle Missing Values
    missing_filled = 0
    if settings.get("fill_missing"):
        for col in df.columns:
            null_count = df[col].isnull().sum()
            if null_count > 0:
                if pd.api.types.is_numeric_dtype(df[col]):
                    # Fill numeric with median
                    fill_val = df[col].median()
                    df[col] = df[col].fillna(fill_val)
                    summary_logs.append(f"Filled {null_count} missing values in numeric '{col}' using median ({fill_val}).")
                else:
                    # Fill categorical with mode or 'Unknown'
                    if not df[col].mode().empty:
                        fill_val = df[col].mode()[0]
                    else:
                        fill_val = 'Unknown'
                    df[col] = df[col].fillna(fill_val)
                    summary_logs.append(f"Filled {null_count} missing values in categorical '{col}' using mode ({fill_val}).")
                missing_filled += null_count
                
    # 4. Outliers Handling
    outliers_handled_count = 0
    if settings.get("handle_outliers") in ["clip", "remove"]:
        numeric_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        for col in numeric_cols:
            col_data = df[col]
            q1 = col_data.quantile(0.25)
            q3 = col_data.quantile(0.75)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
            num_outliers = outlier_mask.sum()
            
            if num_outliers > 0:
                if settings.get("handle_outliers") == "clip":
                    # Clip/Cap the outliers to IQR bounds
                    df[col] = np.clip(df[col], lower_bound, upper_bound)
                    summary_logs.append(f"Capped {num_outliers} outlier(s) in '{col}' to statistical bounds.")
                elif settings.get("handle_outliers") == "remove":
                    # Remove outlier rows
                    df = df[~outlier_mask].reset_index(drop=True)
                    summary_logs.append(f"Removed {num_outliers} row(s) containing outliers in '{col}'.")
                outliers_handled_count += num_outliers

    # 5. Normalize string formats
    if settings.get("normalize_strings"):
        str_cols = [col for col in df.columns if pd.api.types.is_string_dtype(df[col]) or str(df[col].dtype) == 'object']
        for col in str_cols:
            # Safely strip whitespace and normalize casing if needed
            try:
                df[col] = df[col].astype(str).str.strip()
            except Exception:
                pass
                
    final_rows = len(df)
    rows_dropped = initial_rows - final_rows
    
    if not summary_logs:
        summary_logs.append("Dataset was already clean. No modifications needed.")
        
    return df, {
        "success": True,
        "logs": summary_logs,
        "duplicates_removed": duplicates_removed,
        "missing_filled": missing_filled,
        "outliers_handled": int(outliers_handled_count),
        "rows_dropped": rows_dropped,
        "final_rows": final_rows
    }
