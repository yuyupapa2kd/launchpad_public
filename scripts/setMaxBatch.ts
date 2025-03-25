
import { sign } from 'crypto';
import { ethers } from 'hardhat';
async function main() {

  // const {LedgerSigner} = require('@anders-t/ethers-ledger');
  // const wallet = new LedgerSigner(ethers.provider)
  const signers = await ethers.getSigners();
  const wallet = signers[0];  

  const provider = new ethers.JsonRpcProvider(
      'https://public-apigw.kstadium.io/bc',
  )
  
  const newOwner = "0x7545...4704"

  console.log(`owner address : ${await wallet.getAddress()}`)
  
  const LaunchPad = await ethers.getContractAt("LaunchPad", "0x83d2...9D33", wallet)
  console.log(`old owner : ${await LaunchPad.owner()}`)
  // console.log(`maxBatchSize : ${await LaunchPad.getMaxBatchSize()}`)

  const transferOwnership = await LaunchPad.transferOwnership(newOwner)
  // const setMaxBatchSize = await LaunchPad.setMaxBatchSize(300)

  await sleep(6000)
  console.log(`new owner : ${await LaunchPad.owner()}`)

  // console.log(`maxBatchSize : ${await LaunchPad.getMaxBatchSize()}`)

}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
