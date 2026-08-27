# Liquidation Engine Specification

## Contract: `contracts/liquidation-engine`

### Liquidation Math

When an account becomes undercollateralized ($HF < 1.0$), a liquidator can repay up to `close_factor_bps` (e.g. 50%) of the borrower's debt.

$$\text{Repay Amount} \le \text{Total Debt} \times \text{Close Factor}$$

The liquidator receives equivalent value in collateral plus a liquidation bonus:

$$\text{Collateral Seized} = \frac{\text{Repay Amount} \times \left(10,000 + \text{Bonus BPS}\right)}{10,000 \times \text{Collateral Price}}$$
