// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LaunchPad is Ownable {
    struct ProjectMetaData {
        string projectName;
        uint256 startBlock;
        uint256 minInvestPerUser;
        uint256 maxInvestPerUser;
        bool set;
    }

    struct TokenMetaData {
        address tokenCA;
        uint256 totalSupply;
        uint256 multipleViaKSTA;
        bool set;
    }

    struct ProcessInfo {
        uint256 investUserNum;
        uint256 totalInvested;
        uint8 batchLength;
        uint256 remainingQuantity;
        bool open;
        bool succeed;
        bool failed;
    }

    mapping(string => ProjectMetaData) private ProjMeta;
    mapping(string => TokenMetaData) private TokenMeta;
    mapping(string => ProcessInfo) private ProcInfo;
    mapping(string => address[]) private InvestUsers;
    mapping(string => address payable) private Recipient;

    mapping(address => mapping(string => uint256)) private UserInvestHistory;
    mapping(string => mapping(uint8 => bool)) private BatchExecutedCheck;

    uint256 private balance;
    uint256 private maxBatchSize;
    uint256 private multipleDecimals;

    event OpenProject(string projectName, string symbol, uint256 totalSupply, uint256 startBlock);
    event Investment(address indexed user, string symbol, uint256 amount, uint256 investUserNum);
    event CloseProjectSuccess(string projectName, string symbol, uint256 investUserNum, uint256 remainingQuantity);
    event CloseProjectFail(string projectName, string symbol, uint256 investUserNum);

    constructor() Ownable(msg.sender) {
        // maxBatchSize = 500;
        maxBatchSize = 5;  // for test
        balance = 0;
        multipleDecimals = 1 ether;
    }

    receive() external payable {}

    function setProjectMeta(
        string calldata _symbol,
        string calldata _projectName,
        uint256 _startBlock,
        uint256 _minInvestPerUser,
        uint256 _maxInvestPerUser
    ) external onlyOwner {
        require(!ProjMeta[_symbol].set, "project meta already set");
        ProjMeta[_symbol] = ProjectMetaData({
            projectName: _projectName,
            startBlock: _startBlock,
            minInvestPerUser: _minInvestPerUser,
            maxInvestPerUser: _maxInvestPerUser,
            set: true
        });
    }

    function setTokenMetaData(
        string calldata _symbol,
        address _tokenCA,
        uint256 _totalSupply,
        uint256 _multipleViaKSTA
    ) public onlyOwner {
        require(!TokenMeta[_symbol].set, "token meta already set");
        TokenMeta[_symbol] = TokenMetaData({
            tokenCA: _tokenCA,
            totalSupply: _totalSupply,
            multipleViaKSTA: _multipleViaKSTA,
            set: true
        });
    }

    // createProject
    function openProject(
        string calldata _symbol,
        address payable _recipient
    ) external onlyOwner {
        require(ProjMeta[_symbol].set, "project meta not set yet");
        require(TokenMeta[_symbol].set, "token meta not set yet");

        Recipient[_symbol] = _recipient;

        ProcInfo[_symbol] = ProcessInfo({
            investUserNum: 0,
            totalInvested: 0,
            batchLength: 0,
            remainingQuantity: TokenMeta[_symbol].totalSupply,
            open: true,
            succeed: false,
            failed: false
        });

        emit OpenProject(
            ProjMeta[_symbol].projectName,
            _symbol,
            TokenMeta[_symbol].totalSupply,
            ProjMeta[_symbol].startBlock
        );
    }

    // getProjectInfo
    function getProjectMetaData(string calldata _symbol) external view returns(ProjectMetaData memory) {
        return ProjMeta[_symbol];
    }

    function getTokenMetaData(string calldata _symbol) external view returns(TokenMetaData memory) {
        return TokenMeta[_symbol];
    }

    function getProcessInfo(string calldata _symbol) external view returns(ProcessInfo memory) {
        return ProcInfo[_symbol];
    }

    // getRemainingQuantity
    function getRemainingQuantity(string calldata _symbol) external view returns(uint256) {
        return ProcInfo[_symbol].remainingQuantity;
    }

    function getTotalInvested(string calldata _symbol) external view returns(uint256) {
        return ProcInfo[_symbol].totalInvested;
    }

    function getRecipient(string calldata _symbol) external view returns(address payable) {
        return Recipient[_symbol];
    }

    // isOpen
    function isOpen(string calldata _symbol) external view returns(bool) {
        return ProcInfo[_symbol].open;
    }

    // investment
    function investment(string calldata _symbol) external payable {
        ProcessInfo storage process = ProcInfo[_symbol];
        ProjectMetaData storage project = ProjMeta[_symbol];

        // project 가 open 상태여야 함.
        require(process.open, "proposal not opened");
        // startBlock 이 지나있어야 함.
        require(block.number >= project.startBlock, "not reached start block yet");
        // 요청한 수량이 최소 참여수량보다 커야함.
        require(msg.value >= project.minInvestPerUser, "lack minInvestPerUser");
        // 요청한 수량이 최대 참여수량보다 작아야 함.
        require(msg.value <= project.maxInvestPerUser, "over maxInvestPerUser");
        // 잔여 수량이 요청한 수량보다 커야함.
        require(msg.value <= process.remainingQuantity, "over remainingQuantity");
        // 해당 유저의 중복투자 체크
        require(UserInvestHistory[msg.sender][_symbol] == 0, "user already invest this project");

        process.remainingQuantity -= msg.value;
        process.totalInvested += msg.value;
        process.investUserNum ++;
        InvestUsers[_symbol].push(msg.sender);

        UserInvestHistory[msg.sender][_symbol] = msg.value;

        emit Investment(msg.sender, _symbol, msg.value, process.investUserNum);
        
    }

    
    function getUserInvestment(string calldata _symbol, address _user) external view returns(uint256) {
        return UserInvestHistory[_user][_symbol];
    }

    function getUserListLength(string calldata _symbol) external view returns(uint256) {
        return InvestUsers[_symbol].length;
    }
    // closeProject
    function closeProjectSuccess(string calldata _symbol) external onlyOwner {
        IERC20 token = IERC20(TokenMeta[_symbol].tokenCA);
        require(
            token.balanceOf(address(this)) >= TokenMeta[_symbol].totalSupply * TokenMeta[_symbol].multipleViaKSTA / multipleDecimals,
             "lack of token balance"
        );

        ProcessInfo storage process = ProcInfo[_symbol];

        // open 에 false 세팅
        process.open = false;
        process.succeed = true;

        // BatchExcutedCheck 세팅
        uint256 raw = process.investUserNum / maxBatchSize;
        require(raw <= type(uint8).max, "batchLength overflow");
        uint8 batchLen = uint8(raw);
        process.batchLength = batchLen;
        for (uint8 i = 0; i<=batchLen; i++) {
            BatchExecutedCheck[_symbol][i] = true;
        }

        // excuteInvestment
        uint256 excuteInvestmentAmount = process.totalInvested;
        require(address(this).balance >= excuteInvestmentAmount, "lack of coin in possession");
        payable(Recipient[_symbol]).transfer(excuteInvestmentAmount);

        emit CloseProjectSuccess(ProjMeta[_symbol].projectName, _symbol, process.investUserNum, process.remainingQuantity);
    }

    function getBatchLength(string calldata _symbol) external view returns(uint8) {
        return ProcInfo[_symbol].batchLength;
    }

    function checkBatchExcutedIdx(string calldata _symbol, uint8 _batchIdx) external view returns(bool) {
        return BatchExecutedCheck[_symbol][_batchIdx];
    }

    function calcBatchAirDropToken(string calldata _symbol, uint8 _batchIdx) external view onlyOwner returns(uint256) {
        ProcessInfo storage process = ProcInfo[_symbol];
        require(process.succeed, "project not succeed");

        uint256 result = 0;
        uint256 mul = TokenMeta[_symbol].multipleViaKSTA;
        uint256 startPoint = maxBatchSize * _batchIdx;
        uint256 endPoint = (_batchIdx == process.batchLength) ? process.investUserNum : startPoint + maxBatchSize;

        for (uint256 i = startPoint; i < endPoint; i++) {
            result += UserInvestHistory[InvestUsers[_symbol][i]][_symbol] * mul / multipleDecimals;
        }

        return result;
    }

    function executeBatchAirDropToken(string calldata _symbol, uint8 _batchIdx) external onlyOwner {
        ProcessInfo storage process = ProcInfo[_symbol];
        require(process.succeed, "project not succeed");
        require(BatchExecutedCheck[_symbol][_batchIdx], "this batch already excuted");

        // BatchExcutedCheck 에 false 세팅
        BatchExecutedCheck[_symbol][_batchIdx] = false;

        // batch token transfer
        IERC20 token = IERC20(TokenMeta[_symbol].tokenCA);
        uint256 mul = TokenMeta[_symbol].multipleViaKSTA;
        uint256 startPoint = maxBatchSize * _batchIdx;
        uint256 endPoint = (_batchIdx == process.batchLength) ? process.investUserNum : startPoint + maxBatchSize;
        
        for (uint256 i = startPoint; i < endPoint; i++) {
            address recipient = InvestUsers[_symbol][i];
            uint256 amount = UserInvestHistory[recipient][_symbol] * mul / multipleDecimals;
            require(token.transfer(recipient, amount), "token transfer failed");
        }
    }

    function getMaxBatchSize() external view returns (uint256) {
        return maxBatchSize;
    }

    function setMaxBatchSize(uint256 _maxBatchSize) external onlyOwner {
        maxBatchSize = _maxBatchSize;
    }

    function remainedTokenClaim(string calldata _symbol, address _reciever) external onlyOwner {
        require(!ProcInfo[_symbol].open, "project still open");

        IERC20 token = IERC20(TokenMeta[_symbol].tokenCA);
        uint256 mul = TokenMeta[_symbol].multipleViaKSTA;
        uint256 amount = ProcInfo[_symbol].remainingQuantity * mul / multipleDecimals;

        require(token.transfer(_reciever, amount), "token transfer failed");
    }

    // 이하의 기능은 운영상의 이슈 발생 시에 메뉴얼하게 사용될 예정...
    function coinTransferFromCA(address payable _reciever, uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "lack of coin in possession");
        payable(_reciever).transfer(_amount);
    }

    function tokenTransferFromCA(string calldata _symbol, address _reciever, uint256 _amount) external onlyOwner {
        IERC20 token = IERC20(TokenMeta[_symbol].tokenCA);
        require(token.balanceOf(address(this)) >= _amount, "lack of token amount");
        require(token.transfer(_reciever, _amount), "token transfer failed");
    }

    // 이하의 기능은 1차 오픈 시에는 사용되지 않을 예정...
    // 향후 B/E, F/E 에 추가 기획되고 구현되면 사용될 수 있음. 
    function closeProjectFail(string calldata _symbol) external onlyOwner {
        ProcessInfo storage process = ProcInfo[_symbol];
        // open 에 false 세팅
        process.open = false;
        process.failed = true;

        // BatchExcutedCheck 세팅
        uint256 raw = process.investUserNum / maxBatchSize;
        require(raw <= type(uint8).max, "batchLength overflow");
        uint8 batchLen = uint8(raw);
        process.batchLength = batchLen;
        for (uint8 i = 0; i<=batchLen; i++) {
            BatchExecutedCheck[_symbol][i] = true;
        }

        emit CloseProjectFail(ProjMeta[_symbol].projectName, _symbol, process.investUserNum);
    }

    function calcBatchAirDropCoin(string calldata _symbol, uint8 _batchIdx) external view onlyOwner returns(uint256) {
        ProcessInfo storage process = ProcInfo[_symbol];
        require(process.failed, "project not failed");

        uint256 result = 0;
        uint256 startPoint = maxBatchSize * _batchIdx;
        uint256 endPoint = (_batchIdx == process.batchLength) ? process.investUserNum : startPoint + maxBatchSize;
        for (uint256 i = startPoint; i < endPoint; i++) {
            result += UserInvestHistory[InvestUsers[_symbol][i]][_symbol];
        }

        return result;
    }

    function executeBatchAirDropCoin(string calldata _symbol, uint8 _batchIdx) external onlyOwner {
        ProcessInfo storage process = ProcInfo[_symbol];

        require(process.failed, "project not failed");
        require(BatchExecutedCheck[_symbol][_batchIdx], "this batch already excuted");

        // BatchExcutedCheck 에 false 세팅
        BatchExecutedCheck[_symbol][_batchIdx] = false;

        // batch coin transfer
        uint256 startPoint = maxBatchSize * _batchIdx;
        uint256 endPoint = (_batchIdx == process.batchLength) ? process.investUserNum : startPoint + maxBatchSize;
        for (uint256 i = startPoint; i < endPoint; i++) {
            address recipient = InvestUsers[_symbol][i];
            uint256 amount = UserInvestHistory[recipient][_symbol];
            require(address(this).balance >= amount, "lack of coin in possession");
            delete UserInvestHistory[recipient][_symbol];
            payable(recipient).transfer(amount);
        }
    }

    function refreshFailedProjectSymbol(string calldata _symbol) external onlyOwner {
        require(ProcInfo[_symbol].failed, "project not failed");

        address[] storage investors = InvestUsers[_symbol];
        uint256 length = investors.length;
        for (uint256 i = 0; i < length; i++) {
            delete UserInvestHistory[investors[i]][_symbol];
        }

        delete ProjMeta[_symbol];
        delete TokenMeta[_symbol];
        delete ProcInfo[_symbol];
        delete Recipient[_symbol];
        delete InvestUsers[_symbol];
    }
}
