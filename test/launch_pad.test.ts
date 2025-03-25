import { ethers } from "hardhat";
import { expect } from "chai";
import { Signer } from "ethers";
import { LaunchPad } from "../typechain-types/contracts/LaunchPad";
import { ERC20Template } from "../typechain-types";

// 테스트 항목 ================================================
// #1. 프로젝트 메타데이터 설정 (setProjectMeta)
// #2. 토큰 메타데이터 설정 (setTokenMeta)
// #3. 프로젝트 오픈 (openProject)
// #4. 투자 기능 테스트 (investment)
// #5. 중복 투자 방지
// #6. 프로젝트 성공 종료 (closeProjectSuccess)
// #7. 프로젝트 실패 종료 (closeProjectFail)
// #8. 실패한 프로젝트 데이터 삭제 (refreshFailedProjectSymbol)
// ==========================================================

describe("LaunchPad Contract", function () {
  let launchPad: LaunchPad;
  let owner: Signer;
  let investors: Signer[];
  let decimals: bigint;

  let token: ERC20Template;
  let tokenSymbol: string;
  let tokenAmount: bigint;
  let tokenMultiplier: bigint;

  let projectName: string;
  let startBlock: bigint;
  let minInvestPerUser: bigint;
  let maxInvestPerUser: bigint;

  let userInvestmentNomal: bigint;
  let userInvestmentHigh: bigint;
  let userInvestmentAtLast: bigint;
  let userInvestmentOver: bigint;
  let userInvestmentLack: bigint;

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    [owner] = signers;
    investors = signers.slice(1, 20); // investor0 ~ investor18

    const LaunchPadFactory = await ethers.getContractFactory("LaunchPad");
    launchPad = (await LaunchPadFactory.deploy()) as LaunchPad;
    await launchPad.waitForDeployment();

    // 토큰 생성
    const ERC20TemplateFactory = await ethers.getContractFactory("ERC20Template");

    tokenSymbol = "LPT";
    tokenAmount = ethers.parseEther("100");
    tokenMultiplier = ethers.parseEther("2");
    token = (await ERC20TemplateFactory.deploy("TokenSuccess", tokenSymbol, tokenAmount)) as ERC20Template;
    await token.waitForDeployment();
    console.log("Token Address: ", token.target);

    projectName = "LaunchPad Project";
    startBlock = ethers.parseEther("0");
    minInvestPerUser = ethers.parseEther("1");
    maxInvestPerUser = ethers.parseEther("10");
    decimals = ethers.parseEther("1");

    userInvestmentNomal = ethers.parseEther("2");
    userInvestmentHigh = ethers.parseEther("9");
    userInvestmentAtLast = ethers.parseEther("5");
    userInvestmentOver = ethers.parseEther("11");
    userInvestmentLack = ethers.parseEther("0.5");

  });

  it("프로젝트 성공 종료", async function () {
    
    // projMeta 설정 전에 openProject 호출시 실패
    await expect(
      launchPad.connect(owner).openProject(tokenSymbol, await owner.getAddress())
    ).to.be.revertedWith("project meta not set yet");

    // projectMeta 설정을 owner 아닌 유저가 호출하면 실패
    await expect(
      launchPad.connect(investors[0]).setProjectMeta(tokenSymbol, projectName, startBlock, minInvestPerUser, maxInvestPerUser)
    ).to.be.reverted;

    // projectMeta 설정
    await launchPad.connect(owner).setProjectMeta(
      tokenSymbol, // 토큰 심볼
      projectName, // 프로젝트 명
      startBlock, // 시작 블록넘버
      minInvestPerUser, // 최소 투자
      maxInvestPerUser // 최대 투자
    );

    const projectMeta = await launchPad.getProjectMetaData(tokenSymbol);
    expect(projectMeta.projectName).to.equal(projectName);
    console.log(`project name: ${projectMeta.projectName}`);
    console.log("");

    // projectMeta 중복설정 실패
    await expect(
      launchPad.connect(owner).setProjectMeta(tokenSymbol, projectName, startBlock, minInvestPerUser, maxInvestPerUser)
    ).to.be.revertedWith("project meta already set");

    // tokenMeta 설정 전에 openProject 호출시 실패
    await expect(
      launchPad.connect(owner).openProject(tokenSymbol, await owner.getAddress())
    ).to.be.revertedWith("token meta not set yet");

    // tokenMeta 설정 owner 아닌 유저가 호출하면 실패
    const tokenSupply = tokenAmount*decimals/tokenMultiplier;
    await expect(
      launchPad.connect(investors[0]).setTokenMetaData(tokenSymbol, token.target, tokenSupply, tokenMultiplier)
    ).to.be.reverted;

    // tokenMeta 설정
    await launchPad.connect(owner).setTokenMetaData(
      tokenSymbol, 
      token.target, 
      tokenSupply, 
      tokenMultiplier
    );

    const tokenMeta = await launchPad.getTokenMetaData(tokenSymbol);
    expect(tokenMeta.tokenCA).to.equal(token.target);
    console.log(`token ${tokenSymbol} CA: ${tokenMeta.tokenCA}`);
    console.log("");

    // tokenMeta 중복설정 실패
    await expect(
      launchPad.connect(owner).setTokenMetaData(tokenSymbol, token.target, tokenSupply, tokenMultiplier)
    ).to.be.revertedWith("token meta already set");

    // 프로젝트 오픈되지 않은 경우 투자 실패
    await expect(
      launchPad.connect(investors[0]).investment(tokenSymbol, { value: userInvestmentNomal })
    ).to.be.revertedWith("proposal not opened");

    // 프로젝트 오픈 owner 아닌 유저가 호출하면 실패
    await expect(
      launchPad.connect(investors[0]).openProject(tokenSymbol, await owner.getAddress())
    ).to.be.reverted;

    // 프로젝트 오픈
    await launchPad.connect(owner).openProject(tokenSymbol, await owner.getAddress());

    const processInfoStart = await launchPad.getProcessInfo(tokenSymbol);
    expect(processInfoStart.open).to.be.true;
    console.log(`project is ${processInfoStart.open}`);
    console.log("");

    // 최소금액 미만 투자 실패
    await expect(
      launchPad.connect(investors[0]).investment(tokenSymbol, { value: userInvestmentLack })
    ).to.be.revertedWith("lack minInvestPerUser");

    // 최대금액 초과 투자 실패
    await expect(
      launchPad.connect(investors[0]).investment(tokenSymbol, { value: userInvestmentOver })
    ).to.be.revertedWith("over maxInvestPerUser");

    // 투자 기능 테스트
    await expect(
      launchPad
        .connect(investors[0])
        .investment(tokenSymbol, { value: userInvestmentNomal })
    )
      .to.emit(launchPad, "Investment")
      .withArgs(await investors[0].getAddress(), tokenSymbol, userInvestmentNomal, 1);

    const investedAmount = await launchPad.getUserInvestment(
      tokenSymbol,
      await investors[0].getAddress()
    );

    expect(investedAmount).to.equal(userInvestmentNomal);
    console.log(`[0] ${await investors[0].getAddress()} 투자 완료`);
    console.log(`투자금 : ${await launchPad.getUserInvestment(tokenSymbol, await investors[0].getAddress())}`);
    console.log(`잔여투자가능수량 : ${await launchPad.getRemainingQuantity(tokenSymbol)}`);
    console.log("------------------------------------------------------------------");

    // 중복 투자 방지
    await expect(
      launchPad.connect(investors[0]).investment(tokenSymbol, { value: userInvestmentNomal })
    ).to.be.revertedWith("user already invest this project");

    // 여러 투자자의 투자 기능 테스트
    let investedAmountBatch: bigint;
    let remainingQuantityBefore: bigint;
    let remainingQuantityAfter: bigint;
    for (let i = 1; i < 17; i++) {
      remainingQuantityBefore = await launchPad.getRemainingQuantity(tokenSymbol);
      await launchPad.connect(investors[i]).investment(tokenSymbol, { value: userInvestmentNomal });
      console.log(`[${i}] ${await investors[i].getAddress()} 투자 완료`);
      investedAmountBatch = await launchPad.getUserInvestment(tokenSymbol, await investors[i].getAddress());
      remainingQuantityAfter = await launchPad.getRemainingQuantity(tokenSymbol);
      expect(investedAmountBatch).to.equal(userInvestmentNomal);
      expect(remainingQuantityAfter).to.equal(remainingQuantityBefore - userInvestmentNomal);
      console.log(`투자금 : ${investedAmountBatch}`);
      console.log(`잔여투자가능수량 : ${remainingQuantityAfter}`);
      console.log("------------------------------------------------------------------");
    }

    // 잔여 토큰 수량 초과 투자 실패
    remainingQuantityBefore = await launchPad.getRemainingQuantity(tokenSymbol);
    await launchPad.connect(investors[17]).investment(tokenSymbol, { value: userInvestmentHigh });
    console.log(`[${17}] ${await investors[17].getAddress()} 투자 완료`);
    investedAmountBatch = await launchPad.getUserInvestment(tokenSymbol, await investors[17].getAddress());
    remainingQuantityAfter = await launchPad.getRemainingQuantity(tokenSymbol);
    expect(investedAmountBatch).to.equal(userInvestmentHigh);
    expect(remainingQuantityAfter).to.equal(remainingQuantityBefore - userInvestmentHigh);
    console.log(`투자금 : ${investedAmountBatch}`);
    console.log(`잔여투자가능수량 : ${remainingQuantityAfter}`);
    console.log("------------------------------------------------------------------");

    await expect(
      launchPad.connect(investors[18]).investment(tokenSymbol, { value: userInvestmentHigh })
    ).to.be.revertedWith("over remainingQuantity");

    // 잔여 토큰 수량 이내 투자 성공
    remainingQuantityBefore = await launchPad.getRemainingQuantity(tokenSymbol);
    await launchPad.connect(investors[18]).investment(tokenSymbol, { value: userInvestmentAtLast });
    console.log(`[${18}] ${await investors[18].getAddress()} 투자 완료`);
    investedAmountBatch = await launchPad.getUserInvestment(tokenSymbol, await investors[18].getAddress());
    remainingQuantityAfter = await launchPad.getRemainingQuantity(tokenSymbol);
    expect(investedAmountBatch).to.equal(userInvestmentAtLast);
    expect(remainingQuantityAfter).to.equal(remainingQuantityBefore - userInvestmentAtLast);
    console.log(`투자금 : ${await launchPad.getUserInvestment(tokenSymbol, await investors[18].getAddress())}`);
    console.log(`잔여투자가능수량 : ${await launchPad.getRemainingQuantity(tokenSymbol)}`);
    console.log("------------------------------------------------------------------");

    // toekn 전송 전에 closeProject 호출시 실패
    await expect(launchPad.connect(owner).closeProjectSuccess(tokenSymbol)).to.be.revertedWith("lack of token balance");

    // token 전송
    const tokenTransferTx = await token.connect(owner).transfer(launchPad.target, tokenAmount);
    await tokenTransferTx.wait();
    console.log("Token Transfer Tx Hash: ", tokenTransferTx.hash);
    console.log("");

    console.log(`recipient coin amount before: ${await ethers.provider.getBalance(await owner.getAddress())}`);
    await launchPad.connect(owner).closeProjectSuccess(tokenSymbol);
    const processInfo = await launchPad.getProcessInfo(tokenSymbol);
    console.log(`recipient coin amount after : ${await ethers.provider.getBalance(await owner.getAddress())}`);
    expect(processInfo.open).to.be.false;
    expect(processInfo.succeed).to.be.true;

    // 프로젝트 성공 종료 후 투자자들에게 토큰 지급
    const batchLength = await launchPad.getBatchLength(tokenSymbol);
    console.log("");
    console.log(`batch length: ${batchLength}`);
    console.log("");

    let tokenBalanceBefore: bigint;
    let tokenBalanceAfter: bigint;
    let userInvestedAtClose: bigint;
    for (let i = 0; i < batchLength; i++) {
      console.log(`batch : ${i}`);
      tokenBalanceBefore = await token.balanceOf(await investors[i*5].getAddress());
      console.log(`investor[${i*5}] token amount before: ${tokenBalanceBefore}`);
      userInvestedAtClose = await launchPad.getUserInvestment(tokenSymbol, await investors[i*5].getAddress());
      await launchPad.executeBatchAirDropToken(tokenSymbol, i);
      tokenBalanceAfter = await token.balanceOf(await investors[i*5].getAddress());
      expect(tokenBalanceAfter - tokenBalanceBefore).to.equal(userInvestedAtClose*tokenMultiplier/decimals);
      console.log(`investor[${i*5}] token amount after : ${tokenBalanceAfter}`);
      console.log("------------------------------------------------------------------");
    }

    // 잔여 토큰 회수
    const remainedQuantityAtClose = await launchPad.getRemainingQuantity(tokenSymbol);
    const tokenBalanceOwnerBefore = await token.balanceOf(await owner.getAddress());
    console.log(`owner token amount before: ${tokenBalanceOwnerBefore}`);
    console.log(`remained quantity amount : ${remainedQuantityAtClose}`);
    await launchPad.connect(owner).remainedTokenClaim(tokenSymbol, await owner.getAddress());
    const tokenBalanceOwnerAfter = await token.balanceOf(await owner.getAddress());
    expect(tokenBalanceOwnerAfter - tokenBalanceOwnerBefore).to.equal(remainedQuantityAtClose*tokenMultiplier/decimals);
    console.log(`owner token amount after : ${tokenBalanceOwnerAfter}`);

    await expect (launchPad.connect(owner).refreshFailedProjectSymbol(tokenSymbol)).to.be.revertedWith("project not failed");

  });


  it("프로젝트 실패 종료", async function () {
    // projMeta 설정
    await launchPad.connect(owner).setProjectMeta(
      tokenSymbol, 
      projectName, 
      startBlock, 
      minInvestPerUser, 
      maxInvestPerUser
    );
    const projectMeta = await launchPad.getProjectMetaData(tokenSymbol);
    expect(projectMeta.projectName).to.equal(projectName);
    console.log(`project name: ${projectMeta.projectName}`);
    console.log("");

    // tokenMeta 설정
    const tokenSupply = tokenAmount*decimals/tokenMultiplier;
    await launchPad.connect(owner).setTokenMetaData(
      tokenSymbol,
      token.target,
      tokenSupply,
      tokenMultiplier
    );
    const tokenMeta = await launchPad.getTokenMetaData(tokenSymbol);
    expect(tokenMeta.tokenCA).to.equal(token.target);
    console.log(`token ${tokenSymbol} CA: ${tokenMeta.tokenCA}`);
    console.log("");

    // 프로젝트 오픈
    await launchPad.connect(owner).openProject(tokenSymbol, await owner.getAddress());
    const processInfo = await launchPad.getProcessInfo(tokenSymbol);
    expect(processInfo.open).to.be.true;
    console.log(`project is ${processInfo.open}`);
    console.log("");

    // 투자
    console.log("");
    for (let i = 0; i < 19; i++) {
      await launchPad.connect(investors[i]).investment(tokenSymbol, { value: userInvestmentNomal });
      console.log(`[${i}] ${await investors[i].getAddress()} 투자 완료`);
      console.log(`투자금 : ${await launchPad.getUserInvestment(tokenSymbol, await investors[i].getAddress())}`);
      console.log(`잔여투자가능수량 : ${await launchPad.getRemainingQuantity(tokenSymbol)}`);
      console.log("------------------------------------------------------------------");
    }

    // 프로젝트 실패 종료
    await launchPad.connect(owner).closeProjectFail(tokenSymbol);
    const processInfoEnd = await launchPad.getProcessInfo(tokenSymbol);
    expect(processInfoEnd.open).to.be.false;
    expect(processInfoEnd.failed).to.be.true;

    console.log("");
    const batchLength = await launchPad.getBatchLength(tokenSymbol);
    console.log(`batch length: ${batchLength}`);
    for (let i = 0; i < batchLength; i++) {
      console.log(`batch : ${i}`);
      console.log(`recipient coin amount after         : ${await ethers.provider.getBalance(await owner.getAddress())}`);
      console.log(`investor[${i*5}] nativeCoin amount before: ${await ethers.provider.getBalance(await investors[i*5].getAddress())}`);
      await launchPad.executeBatchAirDropCoin(tokenSymbol, i);
      console.log(`investor[${i*5}] nativeCoin amount after : ${await ethers.provider.getBalance(await investors[i*5].getAddress())}`);
      console.log("------------------------------------------------------------------");
    }
  });

});
