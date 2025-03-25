// import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import * as fs from 'fs';
import { sign } from 'crypto';

async function main() {

    // 파라미터 구조체 생성
  interface Project {
    LaunchPadCA: any;
    Symbol: any;
    StartBlock: any;
    TokenCA: any;
  }

  const Project: Project = {
    LaunchPadCA: "0x693c...B1b8",
    Symbol: "DTC",
    StartBlock: 14439030,
    TokenCA: "0x1551...8794",
  }

  // LaunchPad Contract 인스턴스 생성
  const signer = await ethers.getSigners();
  const owner = signer[0];
  const LaunchPad = await ethers.getContractAt("LaunchPad", Project.LaunchPadCA, owner);
  const Token = await ethers.getContractAt("ERC20Template", Project.TokenCA, owner);

  const conn = new ethers.JsonRpcProvider("http://hq.gnd.devnet.kstadium.io:8545");
  // const conn = new ethers.JsonRpcProvider("http://hq.gnd.stgnet.kstadium.io:8545");

  const blockNm = await conn.getBlockNumber();
  console.log(`StartBlock ${Project.StartBlock} - Now ${blockNm}`)

  console.log("01. ProjectMetaData =============================================================================================\n")
  const getProjectMeta = await LaunchPad.getProjectMetaData(Project.Symbol);
  console.log(`projectName      : ${getProjectMeta.projectName}`)
  console.log(`startBlock       : ${getProjectMeta.startBlock}`)
  console.log(`minInvestPerUSer : ${getProjectMeta.minInvestPerUser}`)
  console.log(`maxInvestPerUSer : ${getProjectMeta.maxInvestPerUser}`)
  console.log(`set              : ${getProjectMeta.set}`)
  console.log("\n")
  

  console.log("02. TokenMetaData ==============================================================================================\n")
  const getTokenMetaData = await LaunchPad.getTokenMetaData(Project.Symbol);
  console.log(`tokenCA         : ${getTokenMetaData.tokenCA}`)
  console.log(`totalSupply     : ${getTokenMetaData.totalSupply}`)
  console.log(`multipleViaKSTA : ${getTokenMetaData.multipleViaKSTA}`)
  console.log(`set             : ${getTokenMetaData.set}`)
  console.log("\n")
  

  console.log("03. Process Infomation =========================================================================================\n")
  const getProcessInfo = await LaunchPad.getProcessInfo(Project.Symbol);
  console.log(`investUserNum     : ${getProcessInfo.investUserNum}`)
  console.log(`totalInvested     : ${getProcessInfo.totalInvested}`)
  console.log(`batchLength       : ${getProcessInfo.batchLength}`)
  console.log(`remainingQuantity : ${getProcessInfo.remainingQuantity}`)
  console.log(`open              : ${getProcessInfo.open}`)
  console.log("\n")


  console.log("04. RemainigQuantity ===========================================================================================\n")
  console.log(`RemainingQuantity : ${await LaunchPad.getRemainingQuantity(Project.Symbol)} KSTA`)
  console.log(`TotalInvested     : ${await LaunchPad.getTotalInvested(Project.Symbol)} KSTA`)
  console.log("\n")

  
  console.log("05. Check Recipient ============================================================================================\n")
  console.log(`Recipient         : ${await LaunchPad.getRecipient(Project.Symbol)}`)
  console.log("\n")


  console.log("06. Check isOpen ===============================================================================================\n")
  console.log(`IsOpen            : ${await LaunchPad.isOpen(Project.Symbol)}`)
  console.log("\n")


  console.log("07. Check User Investment ======================================================================================\n")
  const userAddress = ""
  console.log(`${userAddress} invest : ${await LaunchPad.getUserInvestment(Project.Symbol, userAddress)} KSTA`)
  console.log("\n")


  console.log("08. Check UserListLength =======================================================================================\n")
  console.log(`InvestUserLength   : ${await LaunchPad.getUserListLength(Project.Symbol)}`)
  console.log("\n")


  console.log("09. Check BatchLength ==========================================================================================\n")
  console.log(`Batch Length       : ${await LaunchPad.getBatchLength(Project.Symbol)}`)
  console.log("\n")


  console.log("10. Check Batch Excuted Idx ====================================================================================\n")
  const batchExcutedIndex = 0
  console.log(`Check batch excuted index : ${await LaunchPad.checkBatchExcutedIdx(Project.Symbol, batchExcutedIndex)}`)
  console.log("\n")


  console.log("11. Calcuate Batch AirDrop Token Amount ========================================================================\n")
  const calcBatchAirDropTokenIndex = 0
  console.log(`Calculated AirDrop Token Amount in Batch ${calcBatchAirDropTokenIndex} : ${await LaunchPad.calcBatchAirDropToken(Project.Symbol, calcBatchAirDropTokenIndex)}`)
  console.log("\n")


  console.log("12. Check Max Batch Size =======================================================================================\n")
  console.log(`Max Batch Size     : ${await LaunchPad.getMaxBatchSize(Project.Symbol)}`)
  console.log("\n")


  console.log("13. Get Token Balance ==========================================================================================\n")
  const gtbUserAddress = ""
  console.log(`Token Balance of ${gtbUserAddress} : ${await Token.balanceOf(gtbUserAddress)}`)
  console.log("\n")


  console.log("14. Get Coin Balance ===========================================================================================\n")
  const gcbUserAddress = ""
  console.log(`Coin Balance of ${gcbUserAddress}  : ${await conn.getBalance(gcbUserAddress)} KSTA`)
  console.log("\n")

  console.log("15. Get Coin Balance Of LaunchPad CA ===========================================================================\n")
  console.log(`LaunchPad CA Coin Balance          : ${await conn.getBalance(Project.LaunchPadCA)} KSTA`)
  console.log("\n")
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});