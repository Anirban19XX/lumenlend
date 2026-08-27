# Interest Rate Model Contract

The `interest-rate-model` calculates borrowing and supply interest rates dynamically based on liquidity pool utilization.

## Kinked Model Formula

* **Utilization $U$**: $U = \frac{\text{Total Borrowed}}{\text{Total Supplied}}$
* **When $U \le U_{\text{optimal}}$**:
  $$\text{Borrow Rate} = R_{\text{base}} + \left(\frac{U}{U_{\text{optimal}}}\right) \times \text{Slope}_1$$
* **When $U > U_{\text{optimal}}$**:
  $$\text{Borrow Rate} = R_{\text{base}} + \text{Slope}_1 + \left(\frac{U - U_{\text{optimal}}}{1 - U_{\text{optimal}}}\right) \times \text{Slope}_2$$

All rates and ratios use basis points ($10,000 = 100\%$).
