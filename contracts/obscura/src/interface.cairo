use crate::custom_type::I256;
use crate::structs::{Account, ExtData, Proof};

#[starknet::interface]
pub trait IObscura<TContractState> {
    fn register(ref self: TContractState, account: Account);

    fn transact(ref self: TContractState, args: Proof, ext_data: ExtData);

    fn register_and_transact(
        ref self: TContractState, account: Account, args: Proof, ext_data: ExtData,
    );

    fn configure_limits(ref self: TContractState, maximum_deposit_amount: u256);

    fn calculate_public_amount(ref self: TContractState, ext_amount: I256, fee: u256) -> u256;

    fn is_spent(self: @TContractState, nullifier_hash: u256) -> bool;

    fn field_size(self: @TContractState) -> u256;

    fn max_ext_amount(self: @TContractState) -> u256;

    fn min_ext_amount(self: @TContractState) -> u256;

    fn max_fee(self: @TContractState) -> u256;

    fn roots(self: @TContractState) -> Array<u256>;
}
