#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, IntoVal, String, Symbol,
};

const TARGET: Symbol = symbol_short!("TARGET");
const TOTAL: Symbol = symbol_short!("TOTAL");
const NFT_CONTRACT: Symbol = symbol_short!("NFT_CTR");
const CREATOR: Symbol = symbol_short!("CREATOR");
const ADMIN: Symbol = symbol_short!("ADMIN");
const INIT: Symbol = symbol_short!("INIT");
const MS_COUNT: Symbol = symbol_short!("MS_COUNT");

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub votes_for: i128,
    pub votes_against: i128,
    pub released: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    DonorWeight(Address),
    Milestone(u32),
    HasVoted(Address, u32),
    VerifiedCreator(Address),
}

#[contract]
pub struct CrowdfundingContract;

#[contractimpl]
impl CrowdfundingContract {
    /// Initialize campaign with target goal, Dynamic NFT Badge contract, creator, and admin
    pub fn init(env: Env, target_amount: i128, nft_badge_contract: Address, creator: Address, admin: Address) {
        if env.storage().instance().has(&INIT) {
            panic!("Contract is already initialized");
        }
        if target_amount <= 0 {
            panic!("Target amount must be positive");
        }

        env.storage().instance().set(&TARGET, &target_amount);
        env.storage().instance().set(&TOTAL, &0i128);
        env.storage().instance().set(&NFT_CONTRACT, &nft_badge_contract);
        env.storage().instance().set(&CREATOR, &creator);
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&MS_COUNT, &0u32);
        env.storage().instance().set(&INIT, &true);
    }

    /// Admin verifies creator identity and trust status
    pub fn verify_creator(env: Env, admin: Address, creator: Address) {
        admin.require_auth();

        let stored_admin: Address = env.storage().instance().get(&ADMIN).expect("Admin not set");
        if admin != stored_admin {
            panic!("Only designated admin can verify creators");
        }

        env.storage().persistent().set(&DataKey::VerifiedCreator(creator.clone()), &true);

        // Event Stream: Emit creator verification event
        env.events().publish(
            (symbol_short!("verified"), creator),
            true,
        );
    }

    /// Donate XLM, update donor weight, compute NFT Tier (1=Bronze, 2=Silver, 3=Gold), and call Inter-Contract Dynamic NFT Upgrade
    pub fn donate(env: Env, donor: Address, amount: i128) -> u32 {
        donor.require_auth();

        if amount <= 0 {
            panic!("Donation amount must be positive");
        }

        let current_total: i128 = env.storage().instance().get(&TOTAL).unwrap_or(0);
        let new_total = current_total + amount;
        env.storage().instance().set(&TOTAL, &new_total);

        // Update cumulative donor contribution weight
        let donor_key = DataKey::DonorWeight(donor.clone());
        let current_weight: i128 = env.storage().persistent().get(&donor_key).unwrap_or(0);
        let new_weight = current_weight + amount;
        env.storage().persistent().set(&donor_key, &new_weight);

        // Calculate Dynamic NFT Tier based on cumulative contribution (in stroops: 1 XLM = 10,000,000 stroops)
        // Tier 1 = Bronze (< 50 XLM), Tier 2 = Silver (50 - 199 XLM), Tier 3 = Gold (200+ XLM)
        let tier: u32 = if new_weight < 50_0000000i128 {
            1 // Bronze
        } else if new_weight < 200_0000000i128 {
            2 // Silver
        } else {
            3 // Gold
        };

        // 1. Event Stream: Emit donation event
        env.events().publish(
            (symbol_short!("donate"), donor.clone()),
            amount,
        );

        // 2. Inter-Contract Call: Invoke external Dynamic NFT Badge contract mint_or_upgrade(to, tier)
        let nft_contract_addr: Address = env.storage().instance().get(&NFT_CONTRACT).expect("NFT Contract not set");
        
        env.invoke_contract::<()>(
            &nft_contract_addr,
            &Symbol::new(&env, "mint_or_upgrade"),
            soroban_sdk::vec![&env, donor.to_val(), tier.into_val(&env)],
        );

        // 3. Event Stream: Emit Dynamic NFT Evolved event
        env.events().publish(
            (symbol_short!("nft_upg"), donor),
            tier,
        );

        tier
    }

    /// Creator proposes a new payout milestone
    pub fn add_milestone(env: Env, description: String, amount: i128) -> u32 {
        let creator: Address = env.storage().instance().get(&CREATOR).expect("Creator not set");
        creator.require_auth();

        if amount <= 0 {
            panic!("Milestone amount must be positive");
        }

        let count: u32 = env.storage().instance().get(&MS_COUNT).unwrap_or(0);
        let id = count + 1;

        let milestone = Milestone {
            id,
            description,
            amount,
            votes_for: 0,
            votes_against: 0,
            released: false,
        };

        env.storage().persistent().set(&DataKey::Milestone(id), &milestone);
        env.storage().instance().set(&MS_COUNT, &id);

        id
    }

    /// DAO Voting: Donors vote on milestone release weighted by their donation amount
    pub fn vote_milestone(env: Env, donor: Address, milestone_id: u32, approve: bool) {
        donor.require_auth();

        let donor_weight: i128 = env.storage().persistent().get(&DataKey::DonorWeight(donor.clone())).unwrap_or(0);
        if donor_weight <= 0 {
            panic!("Only donors with active contributions can vote");
        }

        let voted_key = DataKey::HasVoted(donor.clone(), milestone_id);
        if env.storage().persistent().has(&voted_key) {
            panic!("Donor has already voted on this milestone");
        }

        let milestone_key = DataKey::Milestone(milestone_id);
        let mut milestone: Milestone = env.storage().persistent().get(&milestone_key).expect("Milestone not found");

        if milestone.released {
            panic!("Milestone is already released");
        }

        if approve {
            milestone.votes_for += donor_weight;
        } else {
            milestone.votes_against += donor_weight;
        }

        env.storage().persistent().set(&milestone_key, &milestone);
        env.storage().persistent().set(&voted_key, &true);

        // Event Stream: Emit milestone vote event
        env.events().publish(
            (symbol_short!("ms_vote"), donor),
            (milestone_id, approve, donor_weight),
        );
    }

    /// Release milestone funds if approved by DAO majority vote
    pub fn release_milestone(env: Env, milestone_id: u32) -> bool {
        let creator: Address = env.storage().instance().get(&CREATOR).expect("Creator not set");
        creator.require_auth();

        let milestone_key = DataKey::Milestone(milestone_id);
        let mut milestone: Milestone = env.storage().persistent().get(&milestone_key).expect("Milestone not found");

        if milestone.released {
            panic!("Milestone funds already released");
        }

        if milestone.votes_for <= milestone.votes_against {
            panic!("Milestone not approved by majority vote");
        }

        milestone.released = true;
        env.storage().persistent().set(&milestone_key, &milestone);

        // Event Stream: Emit milestone released event
        env.events().publish(
            (symbol_short!("ms_rel"), creator),
            (milestone_id, milestone.amount),
        );

        true
    }

    /// View total campaign donations
    pub fn get_total(env: Env) -> i128 {
        env.storage().instance().get(&TOTAL).unwrap_or(0)
    }

    /// View campaign target goal
    pub fn get_target(env: Env) -> i128 {
        env.storage().instance().get(&TARGET).unwrap_or(0)
    }

    /// View donor vote weight
    pub fn get_donor_weight(env: Env, donor: Address) -> i128 {
        env.storage().persistent().get(&DataKey::DonorWeight(donor)).unwrap_or(0)
    }

    /// View donor Dynamic NFT Tier (1=Bronze, 2=Silver, 3=Gold)
    pub fn get_donor_tier(env: Env, donor: Address) -> u32 {
        let weight = Self::get_donor_weight(env, donor);
        if weight < 50_0000000i128 {
            1
        } else if weight < 200_0000000i128 {
            2
        } else {
            3
        }
    }

    /// Check if campaign creator is verified
    pub fn is_creator_verified(env: Env, creator: Address) -> bool {
        env.storage().persistent().get(&DataKey::VerifiedCreator(creator)).unwrap_or(false)
    }

    /// View milestone details
    pub fn get_milestone(env: Env, id: u32) -> Milestone {
        env.storage().persistent().get(&DataKey::Milestone(id)).expect("Milestone not found")
    }
}

#[cfg(test)]
mod test;
