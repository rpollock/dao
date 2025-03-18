// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockNFT is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MockNFT", "MNFT") Ownable(msg.sender) {}

    function mint(address to) external {
        _mint(to, _tokenIdCounter++);
    }
}
