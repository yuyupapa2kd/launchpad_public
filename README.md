# launchpad

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