// The test for this contract has to be done end to end (because of proof generation, there is no
// way to generate proof in snforge or cairo test) and so it is written as a Jest test.
// You can find the Jest test in contracts/tests and you can run those tests with `yarn test:e2e`

use obscura::interface::IObscuraDispatcher;
use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};

fn deploy_contract() -> IObscuraDispatcher {
    let contract = declare("Obscura").unwrap().contract_class();

    // serialize constructor
    let mut calldata: Array<felt252> = array![];
    let levels = 5;
    let maximum_deposit_amount: u256 = 100;

    levels.serialize(ref calldata);
    maximum_deposit_amount.serialize(ref calldata);

    let (contract_address, _) = contract.deploy(@calldata).unwrap();

    IObscuraDispatcher { contract_address }
}
