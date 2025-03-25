
import { ethers } from 'hardhat';

async function main() {

    const tokenName = "DeployTest1";
    const tokenSymbol = "DTD";
    const initSupply = "100000000"

    const signers = await ethers.getSigners();
    const wallet = signers[0];
    console.log("\n\n\n");
    console.log("token Contract Deploy Sequence Start!!!")
    const tokenFactory = await ethers.getContractFactory('ERC20Template', wallet);
    
    const token = await tokenFactory.deploy(tokenName, tokenSymbol, ethers.parseEther(initSupply));
    await token.waitForDeployment();
    
    console.log("===================================================================================\n")
    console.log(`  name       : ${tokenName}`)
    console.log(`  symbol     : ${tokenSymbol}`)
    console.log(`  initSupply : ${initSupply}`)
    console.log(`  owner      : ${wallet.address}`);
    console.log(`  token CA   : ${token.target}`);
    console.log("===================================================================================\n\n")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
