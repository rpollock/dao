// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract VotingDAO {
    struct Proposal {
        uint256 id;
        string description;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address => bool) hasVoted;
    }

    address public owner;
    IERC721 public nftContract;
    uint256 public nextProposalId;
    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(uint256 indexed proposalId, string description, uint256 endTime);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 voteCount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _nftContract) {
        owner = msg.sender;
        nftContract = IERC721(_nftContract);
    }
    function createProposal(string memory _description, uint256 _votingDuration) external onlyOwner {
       uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.description = _description;
        proposal.endTime = block.timestamp + _votingDuration;
        emit ProposalCreated(proposalId, _description, proposal.endTime);
    }

    function vote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp < proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 nftBalance = nftContract.balanceOf(msg.sender);
        require(nftBalance > 0, "No NFTs to vote");

        if (_support) {
            proposal.forVotes += nftBalance;
        } else {
            proposal.againstVotes += nftBalance;
        }
        
        proposal.hasVoted[msg.sender] = true;
        emit Voted(_proposalId, msg.sender, _support, nftBalance);
    }

    function getProposal(uint256 _proposalId) external view returns (
        uint256 id,
        string memory description,
        uint256 endTime,
        uint256 forVotes,
        uint256 againstVotes
    ) {
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.description,
            proposal.endTime,
            proposal.forVotes,
            proposal.againstVotes
        );
    }

    function hasVoted(uint256 _proposalId, address _voter) public view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }
}