
import { sign } from 'crypto';
import { ethers } from 'hardhat';
async function main() {

  const {LedgerSigner} = require('@anders-t/ethers-ledger');
  const wallet = new LedgerSigner(ethers.provider)

  const provider = new ethers.JsonRpcProvider(
      'https://public-apigw.kstadium.io/bc',
  )

  wallet.getFeeData = async () => {
    return {
      lastBaseFeePerGas: null,
      maxFeePerGas: ethers.parseUnits('800', 'gwei'),
      maxPriorityFeePerGas: ethers.parseUnits('800', 'gwei'),
      gasPrice: ethers.parseUnits('800', 'gwei'),
    }
  }
  
  const newOwner = "0x86CB...9BAE"

  console.log(`owner address : ${await wallet.getAddress()}`)
  const LaunchPad = await ethers.getContractAt("LaunchPad", "0x83d2...9D33", wallet)
  console.log(`old owner : ${await LaunchPad.owner()}`)

  const transferOwnership = await LaunchPad.transferOwnership(newOwner)

  await sleep(6000)
  console.log(`new owner : ${await LaunchPad.owner()}`)

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
