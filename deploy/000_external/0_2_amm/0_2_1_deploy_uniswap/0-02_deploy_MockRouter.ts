import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';


import {
    BigNumber,
    utils,
} from 'ethers';

const { 
    parseEther,
    formatUnits,
} = utils;


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, execute, get,getOrNull, log, read } = deployments;

    const {
        deployer,
        dev
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
    
    log(`Deploying contracts with the account: ${deployer}`);
    
    
    const balance = await hre.ethers.provider.getBalance(deployer);
    log(`Account balance: ${formatUnits(balance, 'ether')} ETH`);
    
    
    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------");


    let factoryAddress: String;
    let wethAddress: string;
    // let libraryPath: string;

    // const isForking = process.env.HARDHAT_FORK == undefined ? false: true

    // if(isForking) {
    //     libraryPath = "amm/libraries/UniswapV2Library.sol:UniswapV2Library"
    // } else {
    //     libraryPath = "mocks/UniswapV2LibraryMock.sol:UniswapV2Library"
    // }

    // log('isForking', isForking)

    const LibraryResult = await deploy("UniswapV2Library", {
        // contract: `contracts/${libraryPath}`,
        contract: `contracts/amm/libraries/UniswapV2Library.sol:UniswapV2Library`,
        from: deployer,
    });

    // log(LibraryResult.address)


    const  RouterArgs : {[key: string]: any} = {}; 

    factoryAddress = (await get('FactoryUniswap')).address
    wethAddress  = (await get('TokenWETH')).address;
    
    RouterArgs[`factory`] = factoryAddress;
    RouterArgs[`WETH`] = wethAddress;

    const deploymentName = "RouterUniswap"
    const RouterResult = await deploy(deploymentName, {
        contract: 'UniswapV2Router02', 
        from: deployer,
        args: Object.values(RouterArgs),
        log: true,
        deterministicDeployment: false,
        libraries: {
            UniswapV2Library: LibraryResult.address
        }
    });


    log("------------------ii---------ii---------------------")
    log("----------------------------------------------------")
    log("------------------ii---------ii---------------------")
    log(`Could be found at ....`)
    log(chalk.yellow(`/deployment/${network.name}/${deploymentName}.json`))


    if (RouterResult.newlyDeployed) {

        log(`Router contract address: ${chalk.green(RouterResult.address)}  using ${RouterResult.receipt?.gasUsed} gas`);

        for(var i in RouterArgs){
            log(chalk.yellow( `Argument: ${i} - value: ${RouterArgs[i]}`));
          }

        if(hre.network.tags.production || hre.network.tags.staging){


            try {
                
                await hre.run("verify:verify", {
                    address: RouterResult.address,
                    constructorArguments: Object.values(RouterArgs),
                });

            }
            catch(err) {
                console.log(err)
            }

        } 

    }
    log(chalk.cyan(`Ending Script.....`));
    log(chalk.cyan(`.....`));
  
};
export default func;
func.tags = ["0-2-1-02", "0-2-1","router-uniswap", "external"];
func.dependencies = ["0-2-1-01"];

func.skip = async function (hre: HardhatRuntimeEnvironment) {


    //not use for mainnet fork test,generate local host, or production testnet
    
    //1) mainnet fork test    hre.network.name == 'hardhat' && isMainnetForking == true
    //2) generate local host  hre.network.name == 'localhost' && isMainnetForking == true
    //3) production           hre.network.name == 'bscMainnet' && isMainnetForking == false
    //4) testnet              hre.network.name == 'bscTestnet' && isMainnetForking == false
  
  
    //use for generate hardhat, unit test
    //1) generate hardhat     hre.network.name == 'hardhat' && isMainnetForking == false
    //2) unit test            hre.network.name == 'hardhat' && isMainnetForking == false
  
    let isForking = process.env.HARDHAT_FORK == undefined ? false: true
  
  
    if( (hre.network.name == 'hardhat' && isForking)
       || (hre.network.name == 'localhost' && isForking)
       || (hre.network.name == 'mainnet' && !isForking)  
       || (hre.network.name == 'bscmainnet' && !isForking) 
       || (hre.network.name == 'rinkeby' && !isForking) ){
          return true;
      } else{
          return false;
      }
  
  };