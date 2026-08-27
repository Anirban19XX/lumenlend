# Protocol Data Flow

## 1. Liquidity Supply Flow
1. Supplier approves and calls `supply(user, USDC, amount)` on `LendingPool`.
2. `LendingPool` accrues interest to update `borrow_index`.
3. Contract transfers USDC tokens from user to pool address.
4. User's supplied shares and total supplied liquidity are incremented.
5. Contract emits `supply` event, which the off-chain indexer records.

## 2. Collateral Deposit Flow
1. Borrower calls `deposit_collateral(user, amount)` on `CollateralVault`.
2. Contract transfers XLM tokens to the vault.
3. Vault updates user's collateral balance and emits `deposit_collat` event.

## 3. Borrow Flow
1. Borrower calls `borrow(user, USDC, amount)` on `LendingPool`.
2. `LendingPool` accrues interest on current market debt.
3. `CollateralVault` checks the borrower's total collateral value against oracle price and verifies that the new debt will remain strictly within the Maximum Loan-To-Value limit ($LTV \le \text{Max LTV}$).
4. `LendingPool` updates the user's borrowed debt and principal index.
5. `LendingPool` transfers USDC to borrower and emits `borrow` event.

## 4. Liquidation Flow
1. Market price of XLM drops or borrower's debt compounds until Health Factor $HF < 1.0$.
2. External liquidator calls `liquidate(liquidator, borrower, repay_amount)` on `LiquidationEngine`.
3. `LiquidationEngine` independently calculates seized collateral:
   $$\text{Seized XLM} = \frac{\text{Repay Amount} \times (1 + \text{Bonus})}{\text{XLM Oracle Price}}$$
4. Liquidator repays USDC to `LendingPool`.
5. Vault transfers seized XLM to liquidator.
