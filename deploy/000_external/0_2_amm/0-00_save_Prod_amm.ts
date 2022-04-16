import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {
  DeployFunction,
  DeploymentSubmission
} from 'hardhat-deploy/types';

import factoryabi from "../../../assets/abis/external/uni-factory.json";
import pairabi from "../../../assets/abis/external/uni-pair.json";
import routerabi from "../../../assets/abis/external/uni-router.json";


import {
  utils,
} from 'ethers';

const { 
  formatUnits,
  parseEther,
  parseUnits
} = utils;

  
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy, getOrNull, log ,save } = deployments;
    const {
      deployer,
      uniswapfactory,
      uniswaprouter
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
  
    log(`Saving contracts ....`);
  

    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------");


    const factoryUniswapSubmission : DeploymentSubmission = {
      abi: factoryabi,
      address: uniswapfactory
    }

    await save('FactoryUniswap', factoryUniswapSubmission);
    let existingUniswapFactory = await getOrNull('FactoryUniswap');

    if(existingUniswapFactory) {
      log(`Deployment Saved: FactoryUniswap with address ${chalk.green(existingUniswapFactory.address)}`);
    }

  
    const routerPancakeSubmission : DeploymentSubmission = {
        abi: routerabi,
        address: uniswaprouter
      }

    await save('RouterUniswap', routerPancakeSubmission);
    let existingUniswapRouter = await getOrNull('RouterUniswap');

    if(existingUniswapRouter) {
      log(`Deployment Saved: RouterUniswap with address ${chalk.green(existingUniswapRouter.address)}`);
    }






    
  
}
export default func;
func.tags = ["0-0-02","0-2","amm",'external'];
func.dependencies = ["token"];

// func.skip = async (hre) => (await hre.deployments.getNetworkName()) == 'hardhat'; //skip when it is  hardhat


func.skip = async function (hre: HardhatRuntimeEnvironment) {


  //use for mainnet fork test,generate local host, or production

  //1) mainnet fork test    hre.network.name == 'hardhat' && isMainnetForking == true
  //2) generate local host  hre.network.name == 'localhost' && isMainnetForking == true
  //3) production           hre.network.name == 'bscMainnet' && isMainnetForking == false
  //4) testnet              hre.network.name == 'bscTestnet' && isMainnetForking == false


 //not use for testnet, generate hardhat, unit test
  //1) generate hardhat     hre.network.name == 'hardhat' && isMainnetForking == false
  //2) unit test            hre.network.name == 'hardhat' && isMainnetForking == false



  let isForking = process.env.HARDHAT_FORK == undefined ? false: true

  if( (hre.network.name == 'hardhat' && !isForking) ){
        return true;
    } else{
        return false;
    }


};