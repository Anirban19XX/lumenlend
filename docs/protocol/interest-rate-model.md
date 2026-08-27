# Interest Rate Model Specification

## Kinked Utilization Model

Pool utilization $U$ is defined as:
$$U = \frac{\text{Total Borrowed}}{\text{Total Supplied}}$$

### Piecewise Rate Function

Let:
- $U_{\text{optimal}} = 80\%$ ($8,000\text{ bps}$)
- $R_{\text{base}} = 2.0\%$ ($200\text{ bps}$)
- $\text{Slope}_1 = 5.0\%$ ($500\text{ bps}$)
- $\text{Slope}_2 = 50.0\%$ ($5,000\text{ bps}$)

```
 Borrow Rate (APR)
      ^
 57%  |                                       /
      |                                      /
      |                                     /  (Slope 2 = 50%)
  7%  |                     *--------------
      |                    / (Slope 1 = 5%)
  2%  |-------------------/
      +---------------------+-----------------> Utilization
      0%                   80% (Optimal)    100%
```

### Net Supply Yield
The supplier receives interest derived from active borrowers minus the protocol reserve factor:

$$\text{Supply Rate} = \text{Borrow Rate} \times U \times \left(1 - \text{Reserve Factor}\right)$$
