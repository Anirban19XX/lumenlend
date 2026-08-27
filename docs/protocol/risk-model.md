# LumenLend Protocol Risk Model

## 1. Risk Parameters (XLM / USDC Market)

| Parameter | Value | Basis Points | Description |
| :--- | :--- | :--- | :--- |
| **Max LTV** | 75.0% | 7,500 bps | Maximum borrow capacity against deposited XLM |
| **Liquidation Threshold** | 80.0% | 8,000 bps | Health factor drops below 1.0 when Debt / Collateral exceeds 80% |
| **Liquidation Bonus** | 5.0% | 500 bps | Discount incentive awarded to liquidator |
| **Close Factor** | 50.0% | 5,000 bps | Maximum percentage of delinquent debt repaid in single liquidation |
| **Reserve Factor** | 10.0% | 1,000 bps | Protocol fee retained from borrower interest to build safety reserve |

## 2. Health Factor Formula

$$\text{Health Factor} = \frac{\text{Collateral Value (USD)} \times \text{Liquidation Threshold}}{\text{Outstanding Debt (USD)}}$$

- **$HF \ge 1.5$**: Safe / Healthy position
- **$1.0 \le HF < 1.5$**: Caution / Warning zone
- **$HF < 1.0$**: Undercollateralized / Liquidatable
