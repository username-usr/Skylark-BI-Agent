import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "monday_connection" in data

def test_chat_endpoint_pipeline():
    response = client.post("/api/chat", json={"message": "How is our Energy pipeline looking this quarter?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["metrics"]) > 0

def test_chat_endpoint_cross_board():
    response = client.post("/api/chat", json={"message": "Which customers have open deals and outstanding receivables?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["table"] is not None

