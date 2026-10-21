"""
Pricing and checkout discount calculation module.
"""
from typing import List, Dict, Any


def calculate_subtotal(items: List[Dict[str, Any]]) -> float:
    """Calculate the raw subtotal of items in basket."""
    total = sum(item.get("price", 0.0) * item.get("quantity", 1) for item in items)
    return round(total, 2)


def apply_tier_discount(subtotal: float, tier: str) -> float:
    """
    Apply customer loyalty tier discount:
    - STANDARD: 0% off
    - BRONZE: 5% off
    - SILVER: 10% off
    - GOLD: 20% off
    
    Returns the new subtotal after discount is deducted.
    """
    rates = {
        "STANDARD": 0.0,
        "BRONZE": 0.05,
        "SILVER": 0.10,
        "GOLD": 0.20,
    }
    rate = rates.get(tier.upper(), 0.0)
    
    # BUG: Multiplying subtotal directly by rate instead of deducting it!
    # This charges the customer only the discount amount instead of the discounted price.
    return round(subtotal * rate, 2)


def apply_coupon(amount: float, coupon_code: str) -> float:
    """Apply promotional coupons."""
    coupons = {
        "SAVE10": 10.0,
        "WELCOME5": 5.0,
    }
    discount = coupons.get(coupon_code.upper() if coupon_code else "", 0.0)
    return max(0.0, round(amount - discount, 2))


def calculate_tax(amount: float, tax_rate: float = 0.08) -> float:
    """Calculate sales tax."""
    return round(amount * tax_rate, 2)


def compute_final_order_total(items: List[Dict[str, Any]], tier: str = "STANDARD", coupon_code: str = "", tax_rate: float = 0.08) -> Dict[str, float]:
    """Calculate complete order summary breakdown."""
    subtotal = calculate_subtotal(items)
    tier_discounted = apply_tier_discount(subtotal, tier)
    after_coupon = apply_coupon(tier_discounted, coupon_code)
    tax = calculate_tax(after_coupon, tax_rate)
    final_total = round(after_coupon + tax, 2)

    return {
        "subtotal": subtotal,
        "tier_discounted": tier_discounted,
        "after_coupon": after_coupon,
        "tax": tax,
        "total": final_total,
    }
