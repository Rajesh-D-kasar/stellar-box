#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_crowdfunding_flow() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CrowdfundingContract);
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let donor = Address::generate(&env);

    // 1. Initialize Contract with 500 XLM target
    client.init(&500_0000000i128);
    assert_eq!(client.get_target(), 500_0000000i128);
    assert_eq!(client.get_total(), 0i128);

    // 2. Perform Donation
    env.mock_all_auths();
    let new_total = client.donate(&donor, &50_0000000i128);
    assert_eq!(new_total, 50_0000000i128);
    assert_eq!(client.get_total(), 50_0000000i128);
}
