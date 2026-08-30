import pytest
from app.monday.service import MondayService
from app.analytics.pipeline import PipelineAnalytics
from app.analytics.billing import BillingAnalytics
from app.analytics.cross_board import CrossBoardAnalytics

@pytest.mark.asyncio
async def test_pipeline_analytics_math():
    service = MondayService()
    deals_board = await service.get_deals_board()
    p_data = PipelineAnalytics.analyze_pipeline(deals_board)
    
    summary = p_data["summary"]
    assert summary["total_deals_analyzed"] > 0
    assert summary["total_pipeline_value"] >= 0.0
    assert summary["weighted_pipeline_value"] <= summary["total_pipeline_value"]
    assert isinstance(summary["total_pipeline_value_formatted"], str)

@pytest.mark.asyncio
async def test_billing_analytics_math():
    service = MondayService()
    wo_board = await service.get_work_orders_board()
    b_data = BillingAnalytics.analyze_billing_and_collections(wo_board)
    
    summary = b_data["summary"]
    assert summary["total_contract_value"] >= 0.0
    assert summary["total_billed_value"] >= 0.0
    assert summary["total_collected"] >= 0.0
    assert summary["total_receivable"] >= 0.0

@pytest.mark.asyncio
async def test_cross_board_health():
    service = MondayService()
    deals_board = await service.get_deals_board()
    wo_board = await service.get_work_orders_board()
    
    cb_data = CrossBoardAnalytics.analyze_cross_board_health(deals_board, wo_board)
    assert "high_risk_customers_with_open_deals" in cb_data
    assert "sector_cross_board_matrix" in cb_data

