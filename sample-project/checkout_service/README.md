# Checkout & Pricing Service

A microservice component responsible for calculating basket totals, tiered loyalty discounts, coupon codes, and sales tax for e-commerce transactions.

## Structure
- `src/pricing.py`: Core pricing and discount calculation engine
- `tests/test_pricing.py`: Unit test suite verifying pricing calculations
- `logs/checkout_error.log`: Production incident report and stack trace

## Running Tests
Run unit tests with Python's built-in unittest runner:
```bash
python -m unittest discover -s tests -p "test_*.py"
```
