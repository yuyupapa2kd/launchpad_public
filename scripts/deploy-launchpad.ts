
import { ethers } from 'hardhat';
async function main() {

  const signers = await ethers.getSigners();
  const wallet = signers[0];  

  console.log("launchpad Contract Deploy Sequence Start!!!")
  const contractFactory = await ethers.getContractFactory('LaunchPad', wallet);
  const contract = await contractFactory.deploy({
    maxFeePerGas: ethers.parseUnits('800', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('800', 'gwei'),
    gasPrice: ethers.parseUnits('800', 'gwei'),
  });

  await contract.waitForDeployment();

  console.log("=============================================================================================\n")
  console.log(`LaunchPad Owner Wallet     : ${await wallet.getAddress()}`);
  console.log(`LaunchPad Contract Address : ${contract.target}`);
  console.log("=============================================================================================\n\n")

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
