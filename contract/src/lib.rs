#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

const TARGET: Symbol = symbol_short!("TARGET");
const TOTAL: Symbol = symbol_short!("TOTAL");
const INIT: Symbol = symbol_short!("INIT");

#[contract]
pub struct CrowdfundingContract;

#[contractimpl]
impl CrowdfundingContract {
    /// Initialize the Crowdfunding Donation Box with a target goal
    pub fn init(env: Env, target_amount: i128) {
        if env.storage().instance().has(&INIT) {
            panic!("Contract is already initialized");
        }
        if target_amount <= 0 {
            panic!("Target amount must be positive");
        }

        env.storage().instance().set(&TARGET, &target_amount);
        env.storage().instance().set(&TOTAL, &0i128);
        env.storage().instance().set(&INIT, &true);
    }

    /// Donate XLM to the crowdfunding campaign
    pub fn donate(env: Env, donor: Address, amount: i128) -> i128 {
        donor.require_auth();

        if amount <= 0 {
            panic!("Donation amount must be positive");
        }

        let current_total: i128 = env.storage().instance().get(&TOTAL).unwrap_or(0);
        let new_total = current_total + amount;

        env.storage().instance().set(&TOTAL, &new_total);

        // Emit donation event
        env.events().publish(
            (symbol_short!("donate"), donor),
            amount,
        );

        new_total
    }

    /// Get total XLM donations collected so far
    pub fn get_total(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL).unwrap_or(0)
    }

    /// Get campaign target goal
    pub fn get_target(env: Env) -> i128 {
        env.storage().instance().get(&TARGET).unwrap_or(0)
    }
}
