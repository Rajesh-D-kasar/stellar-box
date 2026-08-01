#![cfg(test)]
use super::*;
use soroban_sdk::{contract, contractimpl, testutils::Address as _, Address, Env, String};

// Mock Dynamic NFT Contract simulating inter-contract NFT mint & tier upgrade
#[contract]
pub struct MockDynamicNftContract;

#[contractimpl]
impl MockDynamicNftContract {
    pub fn mint_or_upgrade(_env: Env, _to: Address, _tier: u32) {
        // Mock inter-contract dynamic NFT tier upgrade operation
    }
}

#[test]
fn test_dynamic_nft_tier_progression() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CrowdfundingContract);
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let admin = Address::generate(&env);
    let nft_contract_id = env.register_contract(None, MockDynamicNftContract);

    client.init(&1000_0000000i128, &nft_contract_id, &creator, &admin);

    let donor = Address::generate(&env);
    env.mock_all_auths();

    // 1st Donation: 20 XLM -> Tier 1 (Bronze)
    let tier1 = client.donate(&donor, &20_0000000i128);
    assert_eq!(tier1, 1);
    assert_eq!(client.get_donor_tier(&donor), 1);

    // 2nd Donation: +40 XLM (Total = 60 XLM) -> Tier 2 (Silver)
    let tier2 = client.donate(&donor, &40_0000000i128);
    assert_eq!(tier2, 2);
    assert_eq!(client.get_donor_tier(&donor), 2);

    // 3rd Donation: +150 XLM (Total = 210 XLM) -> Tier 3 (Gold)
    let tier3 = client.donate(&donor, &150_0000000i128);
    assert_eq!(tier3, 3);
    assert_eq!(client.get_donor_tier(&donor), 3);
}

#[test]
fn test_creator_verification() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CrowdfundingContract);
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let admin = Address::generate(&env);
    let nft_contract_id = env.register_contract(None, MockDynamicNftContract);

    client.init(&500_0000000i128, &nft_contract_id, &creator, &admin);

    assert_eq!(client.is_creator_verified(&creator), false);

    // Admin verifies creator
    env.mock_all_auths();
    client.verify_creator(&admin, &creator);

    assert_eq!(client.is_creator_verified(&creator), true);
}

#[test]
fn test_dao_milestone_voting_and_release() {
    let env = Env::default();
    let contract_id = env.register_contract(None, CrowdfundingContract);
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let admin = Address::generate(&env);
    let nft_contract_id = env.register_contract(None, MockDynamicNftContract);

    client.init(&1000_0000000i128, &nft_contract_id, &creator, &admin);

    env.mock_all_auths();

    // Creator adds Milestone 1 (300 XLM)
    let ms_id = client.add_milestone(&String::from_str(&env, "Phase 1 Delivery"), &300_0000000i128);
    assert_eq!(ms_id, 1);

    // Donors contribute
    let donor1 = Address::generate(&env);
    client.donate(&donor1, &200_0000000i128);

    let donor2 = Address::generate(&env);
    client.donate(&donor2, &50_0000000i128);

    // Donor 1 votes YES (200 vote weight FOR)
    client.vote_milestone(&donor1, &1, &true);

    // Donor 2 votes NO (50 vote weight AGAINST)
    client.vote_milestone(&donor2, &1, &false);

    let milestone = client.get_milestone(&1);
    assert_eq!(milestone.votes_for, 200_0000000i128);
    assert_eq!(milestone.votes_against, 50_0000000i128);

    // Release Milestone 1 (200 > 50 FOR)
    let released = client.release_milestone(&1);
    assert_eq!(released, true);

    assert_eq!(client.get_milestone(&1).released, true);
}
