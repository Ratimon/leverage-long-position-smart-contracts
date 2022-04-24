import * as hre from 'hardhat';

import {
    utils,
  } from 'ethers';
  
const { 
    parseEther,
    hexValue
} = utils;


import {
    to32ByteHex,
    setStorageAt,
    getStorageAt,
} from "../utils";



// export async function getOraclePrice (address: string) : Promise<string> {

//     const returnedPrice = await getStorageAt(address,hexValue(2) )

//    return returnedPrice;
//   }



  export async function overwriteChainlinkAggregator(chainlink: string, value: string, decimals: string) {
    // Deploy new mock aggregator
    const factory = await hre.ethers.getContractFactory('MockChainlinkOracle');
    const mockAggregator = await factory.deploy(value, decimals);
  
    await mockAggregator.deployTransaction.wait();

    // console.log('mockAggregator.address',mockAggregator.address)
  
    // Overwrite storage at chainlink address to use mock aggregator for updates
    // 00 =>  pause = false (boolean)

    const address = `0x0000000000000000000000${mockAggregator.address.slice(2)}00`;

    // │ ChainlinkOracleWrapper      │ _paused                           │      0       │   0    │
    // │ ChainlinkOracleWrapper      │ chainlinkOracle                   │      0       │   1    │ 
    // │ ChainlinkOracleWrapper      │ oracleDecimalsNormalizer          │      1       │   0    │ 
    await hre.network.provider.send('hardhat_setStorageAt', [chainlink, '0x0', address]);
  }

