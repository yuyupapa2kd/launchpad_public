//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20Template is Ownable, ERC20Pausable {

    constructor(string memory _name, string memory _symbol, uint256 _amount) ERC20(_name, _symbol) Ownable(msg.sender) {
        _mint(msg.sender, _amount);
    }

    mapping(address => bool) blacklist;

    modifier isNotFreezed(address _user) {
        require(!blacklist[_user], "Transferable: freezed user");
        _;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unPause() public onlyOwner {
        _unpause();
    }

    function mint(address _account, uint256 _amount) public onlyOwner {
        _mint(_account, _amount);
    }

    // function burn(address _account, uint256 _amount) public onlyOwner {
    //     _burn(_account, _amount);
    // }

    function burn(uint256 _amount) public onlyOwner {
        _burn(msg.sender, _amount);
    }

    function freezing(address _user) public onlyOwner {
        blacklist[_user] = true;
    }

    function unFreezing(address _user) public onlyOwner {
        delete blacklist[_user];
    }

    function isFreezed(address _user) public view returns(bool) {
        return blacklist[_user];
    }
}