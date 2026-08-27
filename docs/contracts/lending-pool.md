# Lending Pool Specification

## Contract: `contracts/lending-pool`

### State Storage
- `MarketState`: Holds `total_supplied`, `total_borrowed`, `total_reserves`, `borrow_index`, `last_accrual_time`, `reserve_factor_bps`.
- `UserLendingPosition`: Holds `supplied_shares`, `principal_borrowed`, `borrow_index`, `last_updated`.

### Interest Index Formula
Interest accumulates continuously over time according to:
$$\text{Index}_{t} = \text{Index}_{t-1} \times \left(1 + \text{Rate}_{\text{borrow}} \times \Delta t\right)$$

User debt at any time $t$:
$$\text{Debt}_t = \text{Principal} \times \frac{\text{Index}_t}{\text{UserIndex}}$$
