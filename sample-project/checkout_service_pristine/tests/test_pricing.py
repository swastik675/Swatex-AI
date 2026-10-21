"""
Unit tests for Checkout & Pricing Service.
"""
import unittest
import sys
import os

# Ensure src is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from pricing import (
    calculate_subtotal,
    apply_tier_discount,
    apply_coupon,
    compute_final_order_total,
)


class TestPricingService(unittest.TestCase):

    def test_calculate_subtotal(self):
        items = [
            {"name": "Mechanical Keyboard", "price": 120.00, "quantity": 1},
            {"name": "USB-C Cable", "price": 15.00, "quantity": 2},
        ]
        self.assertEqual(calculate_subtotal(items), 150.00)

    def test_apply_tier_discount_standard(self):
        # Standard tier should receive 0% discount, remaining 100.0
        result = apply_tier_discount(100.0, "STANDARD")
        self.assertEqual(result, 100.0, f"STANDARD tier should pay $100.00, got {result}")

    def test_apply_tier_discount_gold(self):
        # GOLD tier receives 20% discount on $100 subtotal -> should pay $80.00
        result = apply_tier_discount(100.0, "GOLD")
        self.assertEqual(result, 80.0, f"GOLD tier (20% off $100) should pay $80.00, got {result}")

    def test_apply_tier_discount_silver(self):
        # SILVER tier receives 10% discount on $200 subtotal -> should pay $180.00
        result = apply_tier_discount(200.0, "SILVER")
        self.assertEqual(result, 180.0, f"SILVER tier (10% off $200) should pay $180.00, got {result}")

    def test_apply_coupon(self):
        result = apply_coupon(50.0, "SAVE10")
        self.assertEqual(result, 40.0)

    def test_compute_final_order_total(self):
        items = [{"name": "Developer Monitor", "price": 300.00, "quantity": 1}]
        # GOLD tier: 20% off $300 = $240. SAVE10 coupon: $240 - $10 = $230. Tax 8%: $18.40 -> $248.40
        summary = compute_final_order_total(items, tier="GOLD", coupon_code="SAVE10", tax_rate=0.08)
        self.assertEqual(summary["subtotal"], 300.00)
        self.assertEqual(summary["tier_discounted"], 240.00)
        self.assertEqual(summary["after_coupon"], 230.00)
        self.assertEqual(summary["tax"], 18.40)
        self.assertEqual(summary["total"], 248.40)


if __name__ == "__main__":
    unittest.main()
