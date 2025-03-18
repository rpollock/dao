import { useState, useEffect } from 'react';
import { VotingDAOABI } from './abis/VotingDao';
import { NFTABI } from './abis/NFT';
import Navbar from './components/Navbar';
import './App.css';

const { ethers } = require("ethers");
const VOTING_DAO_ADDRESS = '0x27b1403F345B8267B6a196472e28AFeDB94598d9';
const NFT_CONTRACT_ADDRESS = '0x2ec92364276Bd9cb9cd4649197f495B4D460AEd1';


function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [nftBalance, setNftBalance] = useState(0);

  useEffect(() => {
    const initializeProvider = async () => {
      if (window.ethereum) {
        const newProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(newProvider);
        
        // Check if wallet is already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }
    };
    initializeProvider();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await newProvider.send("eth_requestAccounts", []);
      
      setProvider(newProvider);
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet');
    }
  };

  const fetchProposals = async () => {
    if (!provider || !account) return;
    
    try {
      const votingDAO = new ethers.Contract(VOTING_DAO_ADDRESS, VotingDAOABI, provider);
      const nextId = await votingDAO.nextProposalId();
      
      const proposalPromises = [];
      for (let i = 0; i < nextId; i++) {
        proposalPromises.push(votingDAO.getProposal(i));
      }
      
      const proposalData = await Promise.all(proposalPromises);
      
      const proposalsWithStatus = await Promise.all(
        proposalData.map(async (data, index) => {
          const hasVoted = await votingDAO.hasVoted(index, account);
          const endTimeSeconds = Number(data.endTime);
          
          return {
            id: index,
            description: data.description,
            endTime: endTimeSeconds,
            forVotes: data.forVotes.toString(),
            againstVotes: data.againstVotes.toString(),
            hasVoted,
            isActive: Date.now() < endTimeSeconds * 1000,
          };
        })
      );
      
      setProposals(proposalsWithStatus);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    }
  };
  
  const fetchNFTBalance = async () => {
    if (!provider || !account) return;
    
    try {
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFTABI, provider);
      const balance = await nftContract.balanceOf(account);
      setNftBalance(balance.toString());
    } catch (error) {
      console.error('Error fetching NFT balance:', error);
    }
  };

  useEffect(() => {
    if (account) {
      fetchProposals();
      fetchNFTBalance();
    }
  }, [account, provider]);

  const handleVote = async (proposalId, isFor) => {
    if (!provider || !account) return;
    
    try {
      const signer = await provider.getSigner();
      const votingDAO = new ethers.Contract(VOTING_DAO_ADDRESS, VotingDAOABI, signer);
      
      const tx = await votingDAO.vote(proposalId, isFor);
      await tx.wait();
      
      alert(`Vote ${isFor ? 'for' : 'against'} submitted successfully!`);
      await fetchProposals();
    } catch (error) {
      console.error('Voting error:', error);
      alert(`Voting failed: ${error.reason || error.message}`);
    }
  };

  return (
    <>
    <Navbar />
    <div>
      
      {!account ? (
        <>
        <section className='hero'>
          <div className='main'>
            <h1 className='header-h1'>Welcome To The Cool Pixel Dao</h1>
            <h3 className='header-h3'>Where 1 NFT equals 1 vote, Please connect your wallet to see our proposals</h3>
            <div className='d-conwallet'>
              <button onClick={connectWallet} className='con-wallet'>Connect Wallet</button>
            </div>
          </div>
        </section>
        </>
      ) : (
        <div>
        
          <p className='p-wallet'>Connected: {account}</p>
          <p className='p-nftbal'>Your NFTs: {nftBalance}</p>
          <div>
            {proposals.map((proposal) => (
              <div key={proposal.id} style={{ margin: '20px', padding: '10px', border: '2px solid #ffc20e', borderRadius: '5px' }} className='proposal-div'>
                <h3 className='proposal-desc'>{proposal.description}</h3>
                <p>Ends: {new Date(proposal.endTime * 1000).toLocaleString()}</p>
                <div style={{ display: 'flex', gap: '20px', margin: '10px 0' }}>
                  <div style={{ color: 'green' }}>
                    For: {proposal.forVotes}
                  </div>
                  <div style={{ color: 'red' }}>
                    Against: {proposal.againstVotes}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={proposal.hasVoted || !proposal.isActive || nftBalance === '0'}
                    style={{ backgroundColor: proposal.hasVoted ? '#ccc' : 'green', boxShadow: "2px 2px 0px #939393" }}
                    className='for-button'
                  >
                    {proposal.hasVoted ? 'Voted' : 'Vote For'}
                  </button>
                  <button 
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={proposal.hasVoted || !proposal.isActive || nftBalance === '0'}
                    style={{ backgroundColor: proposal.hasVoted ? '#ccc' : 'red', boxShadow: "2px 2px 0px #939393" }}
                    className='against-button'
                  >
                    {proposal.hasVoted ? 'Voted' : 'Vote Against'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default App;