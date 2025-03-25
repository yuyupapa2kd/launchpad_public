# launchpad

### 서비스 개요
ERC-20 토큰의 Pre-Sale 을 진행하여 개발사에게 NativeCoin 을 투자금으로 지급하는 DApp

### 투자안의 처리 순서
1. 프로젝트 메타데이터 설정 -> 토큰 메타데이터 설정 -> 프로젝트 오픈

2. 유저들의 투자 진행

3. 프로젝트 종료 -> 개발사에게는 유저들이 투자한 NativeCoin 지급, 투자한 유저들에게는 투자금에 따라 Token 지급


### 실행환경 설정

```
git clone https://github.com/yuyupapa2kd/launchpad_public.git
npm install -d
npx hardhat compile
```

### 컨트랙트 배포
```
npx hardhat run scripts/deploy-launchpad.ts --network dev
```

### 테스트 스크립트 실행
```
npx hardhat typechain
REPORT_GAS=true npx hardhat test
```