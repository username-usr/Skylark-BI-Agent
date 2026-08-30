import pytest
from app.normalization.normalizers import (
    normalize_currency, normalize_date, normalize_sector, normalize_customer_code, normalize_probability
)

def test_normalize_currency():
    # Valid numbers & formatted strings
    val, is_missing, raw = normalize_currency("489,360.50")
    assert val == 489360.50
    assert not is_missing

    val, is_missing, raw = normalize_currency("₹ 1,76,16,960")
    assert val == 17616960.0
    assert not is_missing

    # Missing & Null values
    val, is_missing, raw = normalize_currency(None)
    assert val is None
    assert is_missing

    val, is_missing, raw = normalize_currency("N/A")
    assert val is None
    assert is_missing

    val, is_missing, raw = normalize_currency("")
    assert val is None
    assert is_missing

def test_normalize_date():
    iso_str, dt, is_missing, raw = normalize_date("2026-02-26")
    assert iso_str == "2026-02-26"
    assert not is_missing

    iso_str, dt, is_missing, raw = normalize_date(None)
    assert iso_str is None
    assert is_missing

def test_normalize_sector():
    assert normalize_sector("Mining ") == "Mining"
    assert normalize_sector("powerline") == "Powerline"
    assert normalize_sector(None) == "Unspecified Sector"

def test_normalize_customer_code():
    assert normalize_customer_code("company089") == "COMPANY089"
    assert normalize_customer_code(None) == "UNKNOWN_CLIENT"

def test_normalize_probability():
    assert normalize_probability("High") == 0.8
    assert normalize_probability("Medium") == 0.5
    assert normalize_probability("Low") == 0.2
    assert normalize_probability("75%") == 0.8

