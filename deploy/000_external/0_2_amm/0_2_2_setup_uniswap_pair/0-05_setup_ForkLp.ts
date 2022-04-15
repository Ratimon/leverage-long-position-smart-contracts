import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';


import {
    BigNumber,
    ethers,
    utils,
} from 'ethers';

const { 
    parseEther,
    formatUnits,
} = utils;

import {
    IERC20
  } from '../../../../typechain/IERC20';


import {
    impersonate
} from "../../../../test/utils";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, execute, get,getOrNull, log, read } = deployments;

    const {
        deployer,
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
    
    
    
    const balance = await hre.ethers.provider.getBalance(deployer);
    log(`Account balance: ${formatUnits(balance, 'ether')} ETH`);
    
    
    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------")

    
    let wethAddress: string;
    let daiAddress: string;

    let routerAddress: string;

    let topWethHolderAsSigner : ethers.Signer;

    wethAddress  = (await get('TokenWETH')).address;
    daiAddress  = (await get('TokenDAI')).address;
    routerAddress = (await get('RouterUniswap')).address;

    let top3wethAddress = '0xf977814e90da44bfa03b6295a0616a897441acec'
    topWethHolderAsSigner = await impersonate(top3wethAddress);

    let wethContract =  (await hre.ethers.getContract('TokenWETH') as IERC20) 


    let lpSupply: BigNumber = await read( 'pairWethDai', 'totalSupply')


    let needUpdated = lpSupply.eq(BigNumber.from('0'));


    if (needUpdated){

        // ratio weth:dai => 1:3000
        let wethAmountToAdd : Number = 20;
        let daiAmountToAdd : Number = 60000;

        const  approveArgs : any[] =  [
            routerAddress,
            BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
        ];


        const  mintDAIArgs : any[] =  [
            deployer,
            parseEther(`${daiAmountToAdd}`)
        ];

        await wethContract.connect(topWethHolderAsSigner)
            .transfer(deployer, parseEther(`${wethAmountToAdd}`))


        await execute(
            'TokenWETH',
            {from: deployer, log: true}, 
            "approve",
            ...approveArgs
        )


        await execute(
            'TokenDAI',
            {from: deployer, log: true}, 
            "mint",
            ...mintDAIArgs
        );


        await execute(
            'TokenDAI',
            {from: deployer, log: true}, 
            "approve",
            ...approveArgs
        )


        const  addLiquidityArgs : any[] =  [
            wethAddress, // address tokenA,  
            daiAddress, // address tokenB,
            parseEther(`${wethAmountToAdd}`),// uint amountADesired
            parseEther(`${daiAmountToAdd}`),//uint amountBDesired 
            parseEther(`${wethAmountToAdd}`).mul(BigNumber.from('99')).div(BigNumber.from('100')), // uint amountAMin
            parseEther(`${daiAmountToAdd}`).mul(BigNumber.from('99')).div(BigNumber.from('100')), //uint amountBMin,
            deployer, // address to,
            Date.now() + 1000 * 60 * 10//uint deadline
        ];


        
        await execute(
            'RouterUniswap',
            {from: deployer, log: true}, 
            "addLiquidity",
            ...addLiquidityArgs
            )  
    }    

    
    log(chalk.cyan(`Ending Script.....`));
    log(chalk.cyan(`.....`));
  
};
export default func;
func.tags = ["0-2-1-05A", "0-2-2","mock-lp", "external"];
func.dependencies = ["0-2-2-04"];

func.skip = async () => true;

// func.skip = async function (hre: HardhatRuntimeEnvironment) {


//     //not use for mainnet fork test, unit test, production, or testnet,

//     //1) generate hardhat     hre.network.name == 'hardhat' && isMainnetForking == false
//     //2) unit test            hre.network.name == 'hardhat' && isMainnetForking == false
//     //3) production           hre.network.name == 'bscMainnet' && isMainnetForking == false
//     //4) testnet              hre.network.name == 'bscTestnet' && isMainnetForking == false
  
//     //use for mainnet fork,  generate hardhat, generate local host,
//     //1) mainnet fork test    hre.network.name == 'hardhat' && isMainnetForking == true
//     //2) generate local host  hre.network.name == 'localhost' && isMainnetForking == true


  
//     const isForking = process.env.HARDHAT_FORK == undefined ? false: true
  
  
//     if( (hre.network.name == 'hardhat' && !isForking)
//        || (hre.network.name == 'localhost' && !isForking)
//        || (hre.network.name == 'mainnet' && !isForking)
//        || (hre.network.name == 'bscmainnet' && !isForking)
//        || (hre.network.name == 'bsctestnet' && !isForking)
//        || (hre.network.name == 'rinkeby' && !isForking) ){
//           return true;
//       } else{
//           return false;
//       }
  
//   };