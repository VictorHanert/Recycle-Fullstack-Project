from unittest.mock import MagicMock

from app.services.admin_service import AdminService


def test_get_enhanced_statistics_formats_values_and_uses_queries():
    db = MagicMock()

    # total products
    product_count_query = MagicMock()
    product_count_query.count.return_value = 20

    # sold products + revenue
    sold_query = MagicMock()
    sold_filtered = MagicMock()
    sold_filtered.count.return_value = 5
    sold_filtered.scalar.return_value = 100.5
    sold_query.filter.return_value = sold_filtered

    # active products + average price
    active_query = MagicMock()
    active_filtered = MagicMock()
    active_filtered.count.return_value = 10
    active_filtered.scalar.return_value = 50.25
    active_query.filter.return_value = active_filtered

    # category distribution
    category_query = MagicMock()
    cat_join = category_query.join.return_value
    cat_group = cat_join.group_by.return_value
    cat_order = cat_group.order_by.return_value
    cat_order.all.return_value = [("Cat A", 7), ("Cat B", 3)]

    # monthly products
    monthly_products_query = MagicMock()
    mp_filter = monthly_products_query.filter.return_value
    mp_group = mp_filter.group_by.return_value
    mp_order = mp_group.order_by.return_value
    mp_order.all.return_value = [("2024-07", 3), ("2024-08", 4)]

    # monthly sales
    monthly_sales_query = MagicMock()
    ms_filter = monthly_sales_query.filter.return_value
    ms_group = ms_filter.group_by.return_value
    ms_order = ms_group.order_by.return_value
    ms_order.all.return_value = [("2024-07", 2, 20.0), ("2024-08", 1, 10.0)]

    db.query.side_effect = [
        product_count_query,
        sold_query,
        active_query,
        sold_query,   # reused for revenue scalar
        active_query, # reused for average price scalar
        category_query,
        monthly_products_query,
        monthly_sales_query,
    ]

    stats = AdminService(db).get_enhanced_statistics()

    assert stats["total_products"] == 20
    assert stats["sold_products"] == 5
    assert stats["active_products"] == 10
    assert stats["conversion_rate"] == 25.0
    assert stats["revenue_from_sold_products"] == 100.5
    assert stats["average_price"] == 50.25
    assert stats["category_distribution"] == [
        {"category": "Cat A", "count": 7},
        {"category": "Cat B", "count": 3},
    ]
    assert stats["monthly_trends"]["products"] == [
        {"month": "2024-07", "count": 3},
        {"month": "2024-08", "count": 4},
    ]
    assert stats["monthly_trends"]["sales"] == [
        {"month": "2024-07", "count": 2, "revenue": 20.0},
        {"month": "2024-08", "count": 1, "revenue": 10.0},
    ]


def test_get_enhanced_statistics_handles_zero_totals():
    db = MagicMock()

    zero_count_query = MagicMock()
    zero_count_query.count.return_value = 0
    zero_filtered = MagicMock()
    zero_filtered.count.return_value = 0
    zero_filtered.scalar.return_value = None
    zero_count_query.filter.return_value = zero_filtered

    category_query = MagicMock()
    category_query.join.return_value.group_by.return_value.order_by.return_value.all.return_value = []

    monthly_products_query = MagicMock()
    monthly_products_query.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

    monthly_sales_query = MagicMock()
    monthly_sales_query.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = []

    db.query.side_effect = [
        zero_count_query,
        zero_count_query,
        zero_count_query,
        zero_count_query,
        zero_count_query,
        category_query,
        monthly_products_query,
        monthly_sales_query,
    ]

    stats = AdminService(db).get_enhanced_statistics()

    assert stats["total_products"] == 0
    assert stats["conversion_rate"] == 0
    assert stats["revenue_from_sold_products"] == 0
    assert stats["average_price"] == 0
    assert stats["category_distribution"] == []
    assert stats["monthly_trends"]["products"] == []
    assert stats["monthly_trends"]["sales"] == []
