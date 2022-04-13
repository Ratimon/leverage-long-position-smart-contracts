// import { config as dotenvConfig } from "dotenv";
import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
// import { NetworkUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-web3";
import 'hardhat-deploy-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import "hardhat-contract-sizer";
import 'hardhat-deploy';
import "solidity-coverage"
import 'hardhat-tracer';
import "hardhat-log-remover"
import "hardhat-storage-layout"
import "@tenderly/hardhat-tenderly"


import {node_url, accounts, addForkConfiguration} from './utils/network';

import tasks from './tasks'
for (const tsk of tasks) { tsk() }



const ETHERSCAN_KEY = process.env.ETHERSCANKEY;



const config: HardhatUserConfig = {


  solidity: {

    compilers: [

      {
        version: "0.5.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100
          }
        }
      },

      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },

      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          outputSelection: {
            "*": {
                "*": ["storageLayout"],
            },
          },
        }
      }
      
    ],


  },
  namedAccounts: {
    deployer: 0,
    dev: 1,


    zero: "0x0000000000000000000000000000000000000000",
    

    weth: {
      31337: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      56: "0x2170ed0880ac9a755fd29b2688956bd959f933f8", //Mapped from https://bscscan.com/address/0x2170ed0880ac9a755fd29b2688956bd959f933f8
      97: "0xA3234ceaaf5877239738a71B1ea24b86f8EF7D5C",
    },

    dai: {
      31337: "0x6B175474E89094C44Da98b954EedeAC495271d0F",  //Mapped from https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f
      1: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      4: "0x0000000000000000000000000000000000000000", 

    },

    uniswapfactory: {
      31337: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
      1: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Mapped from  https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory
      4: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Mapped from  https://docs.uniswap.org/protocol/V2/reference/smart-contracts/factory
    },

    uniswaprouter: {
      31337: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      1: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Mapped from  https://docs.uniswap.org/protocol/V2/reference/smart-contracts/router-02
      4: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Mapped from  https://docs.uniswap.org/protocol/V2/reference/smart-contracts/router-02
    },

    comptroller: {
      31337: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
      1: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b", // Mapped from  https://compound.finance/docs
      4: "0x2eaa9d77ae4d8f9cdd9faacd44016e746485bddb"
    },

    cether: {
      31337: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5",
      1: "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5", // Mapped from  https://compound.finance/docs
      4: "0xd6801a1dffcd0a410336ef88def4320d6df1883e"
    },

    cdai: {
      31337: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643",
      1: "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643", // Mapped from  https://compound.finance/docs
      4: "0x6d7f0754ffeb405d23c51ce938289d4835be3b14"
    },

    ethChainlinkOracle: {
      31337: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //Mock to mainnet
      1: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", //Mapped from  https://docs.chain.link/docs/ethereum-addresses/
      4: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },

    daiChainlinkOracle: {
      31337: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", //Mock to mainnet
      1: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9", //Mapped from  https://docs.chain.link/docs/ethereum-addresses/
      4: "0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF",
    },



  },


  networks: addForkConfiguration({
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
      tags: ['test']
    },
    localhost: {
      url: node_url('localhost'),
      accounts: accounts(),
    },
    staging: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    production: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    mainnet: {
      url: node_url('mainnet'),
      accounts: accounts('mainnet'),
    },
    rinkeby: {
      url: node_url('rinkeby'),
      accounts: accounts('rinkeby'),
    },
    kovan: {
      url: node_url('kovan'),
      accounts: accounts('kovan'),
    },
    goerli: {
      url: node_url('goerli'),
      accounts: accounts('goerli'),
    },

    bscmainnet: {
      // url: "https://bsc-dataseed.binance.org/",
      url: node_url('bscmainnet'),
      accounts: accounts('bscmainnet'),
      chainId: 56,
      gasPrice: 5000000000,

      throwOnTransactionFailures: false,
      // if true,  throw stack traces on transaction failures.
      // If false, return  failing transaction hash.
      throwOnCallFailures: true,
      // If is true, will throw  stack traces when a call fails.
      // If false, will return the call's return data, which can contain a revert reason
      tags: ['production'],
    },


    bscmainnetfork: {
      url: node_url('bscmainnetfork'),
      accounts: accounts('bscmainnetfork'),
      tags: ['fork']
    },


    bsctestnet: {
      url: node_url('bsctestnet'),
      accounts: accounts('bsctestnet'),
      chainId: 97,
      gasPrice: 10000000000,

      tags: ["staging"]

    },

  }),

  external: process.env.HARDHAT_FORK
  ? {
      deployments: {
        // process.env.HARDHAT_FORK will specify the network that the fork is made from.
        // these lines allow it to fetch the deployments from the network being forked from both for node and deploy task
        hardhat: ['deployments/' + process.env.HARDHAT_FORK],
        localhost: ['deployments/' + process.env.HARDHAT_FORK],
      },
    }
  : undefined,

  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_KEY 
  },


  paths: {
    sources: './contracts',
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: './deploy',
    deployments: './deployments',
    imports: './imports'
  },

  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },

  mocha: {
    timeout: 300000
  },
  
  
  
};

export default config;