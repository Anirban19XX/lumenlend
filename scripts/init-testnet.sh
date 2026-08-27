#!/usr/bin/env bash
# Real testnet init: deploys nothing (contracts already deployed), just calls
# initialize on all 5 + seeds an oracle price. Run once per fresh deploy.
set -euo pipefail
cd "$(dirname "$0")/.."

SOURCE="lumenlend-deployer"
NP="Test SDF Network ; September 2015"
RPC="https://soroban-testnet.stellar.org:443"

: "${ORACLE_MANAGER_CONTRACT_ID:?set ORACLE_MANAGER_CONTRACT_ID}"
: "${INTEREST_RATE_MODEL_CONTRACT_ID:?set INTEREST_RATE_MODEL_CONTRACT_ID}"
: "${COLLATERAL_VAULT_CONTRACT_ID:?set COLLATERAL_VAULT_CONTRACT_ID}"
: "${LENDING_POOL_CONTRACT_ID:?set LENDING_POOL_CONTRACT_ID}"
: "${LIQUIDATION_ENGINE_CONTRACT_ID:?set LIQUIDATION_ENGINE_CONTRACT_ID}"
: "${XLM_CONTRACT_ID:?set XLM_CONTRACT_ID}"

ADMIN=$(stellar keys address "$SOURCE")
echo "Admin: $ADMIN"

invoke() {
  local id="$1"; shift
  stellar contract invoke --id "$id" --source "$SOURCE" --rpc-url "$RPC" --network-passphrase "$NP" -- "$@"
}

echo "-> oracle-manager.initialize"
invoke "$ORACLE_MANAGER_CONTRACT_ID" initialize --admin "$ADMIN"

echo "-> interest-rate-model.initialize"
invoke "$INTEREST_RATE_MODEL_CONTRACT_ID" initialize --admin "$ADMIN" \
  --config '{ "base_rate_bps": 200, "optimal_utilization_bps": 8000, "slope_1_bps": 500, "slope_2_bps": 5000 }'

echo "-> collateral-vault.initialize"
invoke "$COLLATERAL_VAULT_CONTRACT_ID" initialize --admin "$ADMIN" \
  --oracle_manager "$ORACLE_MANAGER_CONTRACT_ID" \
  --lending_pool "$LENDING_POOL_CONTRACT_ID" \
  --liquidation_engine "$LIQUIDATION_ENGINE_CONTRACT_ID" \
  --config "{ \"collateral_asset\": \"$XLM_CONTRACT_ID\", \"borrow_asset\": \"$XLM_CONTRACT_ID\", \"max_ltv_bps\": 7500, \"liquidation_threshold_bps\": 8000, \"is_enabled\": true }"

echo "-> lending-pool.initialize"
invoke "$LENDING_POOL_CONTRACT_ID" initialize --admin "$ADMIN" \
  --collateral_vault "$COLLATERAL_VAULT_CONTRACT_ID" \
  --rate_model "$INTEREST_RATE_MODEL_CONTRACT_ID"

echo "-> lending-pool.init_market"
invoke "$LENDING_POOL_CONTRACT_ID" init_market --asset "$XLM_CONTRACT_ID" --reserve_factor_bps 1000

echo "-> liquidation-engine.initialize"
invoke "$LIQUIDATION_ENGINE_CONTRACT_ID" initialize --admin "$ADMIN" \
  --collateral_vault "$COLLATERAL_VAULT_CONTRACT_ID" \
  --lending_pool "$LENDING_POOL_CONTRACT_ID" \
  --oracle_manager "$ORACLE_MANAGER_CONTRACT_ID" \
  --config "{ \"asset\": \"$XLM_CONTRACT_ID\", \"liquidation_bonus_bps\": 500, \"close_factor_bps\": 5000, \"is_enabled\": true }"

echo "-> oracle-manager.set_price (seed XLM @ \$0.12)"
invoke "$ORACLE_MANAGER_CONTRACT_ID" set_price --asset "$XLM_CONTRACT_ID" --price 120000000 --decimals 9

echo "Done. All 5 contracts initialized."
