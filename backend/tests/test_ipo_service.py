import pytest
from services.ipo_service import list_ipos, get_ipo_by_id

def test_list_all_ipos():
    res = list_ipos("all")
    assert res.total >= 8
    statuses = {ipo.status for ipo in res.ipos}
    assert "Open" in statuses
    assert "Closed" in statuses
    assert "Upcoming" in statuses
    assert "Listed" in statuses

def test_filter_open_ipos():
    res = list_ipos("open")
    assert res.total >= 3
    for ipo in res.ipos:
        assert ipo.status == "Open"
        assert ipo.lot_size > 0
        assert ipo.min_investment > 0

def test_filter_closed_ipos():
    res = list_ipos("closed")
    assert res.total >= 2
    for ipo in res.ipos:
        assert ipo.status == "Closed"

def test_filter_upcoming_ipos():
    res = list_ipos("upcoming")
    assert res.total >= 3
    for ipo in res.ipos:
        assert ipo.status == "Upcoming"

def test_get_ipo_by_id():
    ipo = get_ipo_by_id("enviro-infra-engineers")
    assert ipo is not None
    assert ipo.symbol == "ENVIROINFRA"
    assert ipo.status == "Open"
    assert ipo.gmp > 0

