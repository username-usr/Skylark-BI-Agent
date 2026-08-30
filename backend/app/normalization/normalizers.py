import re
from datetime import datetime
from typing import Optional, Union, Tuple, Any
import pandas as pd

def normalize_currency(val: Any) -> Tuple[Optional[float], bool, str]:
    if pd.isna(val) or val is None:
        return None, True, ""
    
    raw_str = str(val).strip()
    if not raw_str or raw_str.upper() in ["NONE", "NULL", "N/A", "NAN", "-", "N.A.", ""]:
        return None, True, raw_str

    clean_str = re.sub(r"[^\d.-]", "", raw_str)
    
    if not clean_str or clean_str == "-":
        return None, True, raw_str
        
    try:
        parsed_val = float(clean_str)
        return parsed_val, False, raw_str
    except ValueError:
        return None, True, raw_str

def normalize_date(val: Any) -> Tuple[Optional[str], Optional[datetime], bool, str]:
    if pd.isna(val) or val is None:
        return None, None, True, ""
        
    if isinstance(val, (datetime, pd.Timestamp)):
        dt = val.to_pydatetime() if isinstance(val, pd.Timestamp) else val
        return dt.strftime("%Y-%m-%d"), dt, False, dt.strftime("%Y-%m-%d")

    raw_str = str(val).strip()
    if not raw_str or raw_str.upper() in ["NONE", "NULL", "N/A", "NAN", "-", ""]:
        return None, None, True, raw_str

    date_formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%b %d, %Y",
        "%d %b %Y"
    ]
    
    for fmt in date_formats:
        try:
            dt = datetime.strptime(raw_str, fmt)
            return dt.strftime("%Y-%m-%d"), dt, False, raw_str
        except ValueError:
            continue

    try:
        dt = datetime.fromisoformat(raw_str)
        return dt.strftime("%Y-%m-%d"), dt, False, raw_str
    except ValueError:
        pass

    return None, None, True, raw_str

def normalize_sector(val: Any) -> str:
    if pd.isna(val) or val is None:
        return "Unspecified Sector"
    raw_str = str(val).strip()
    if not raw_str or raw_str.upper() in ["NONE", "NULL", "N/A", "NAN", "-"]:
        return "Unspecified Sector"
    return raw_str.title()

def normalize_customer_code(val: Any) -> str:
    if pd.isna(val) or val is None:
        return "UNKNOWN_CLIENT"
    raw_str = str(val).strip()
    if not raw_str or raw_str.upper() in ["NONE", "NULL", "N/A", "NAN", "-"]:
        return "UNKNOWN_CLIENT"
    return raw_str.upper()

def normalize_probability(val: Any) -> float:
    if pd.isna(val) or val is None:
        return 0.5
    raw_str = str(val).strip().lower()
    
    if "high" in raw_str or "75%" in raw_str or "90%" in raw_str:
        return 0.8
    elif "medium" in raw_str or "50%" in raw_str:
        return 0.5
    elif "low" in raw_str or "25%" in raw_str or "10%" in raw_str:
        return 0.2
    
    clean_str = re.sub(r"[^\d.]", "", raw_str)
    if clean_str:
        try:
            num = float(clean_str)
            if num > 1.0:
                num = num / 100.0
            return max(0.0, min(1.0, num))
        except ValueError:
            pass
            
    return 0.5

