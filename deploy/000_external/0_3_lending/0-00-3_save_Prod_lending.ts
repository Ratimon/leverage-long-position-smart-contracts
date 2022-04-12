import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {
  DeployFunction,
  DeploymentSubmission
} from 'hardhat-deploy/types';

import comptrollerabi from "../../../src/abis/external/comptroller.json";
import ctokenabi from "../../../src/abis/external/ctoken.json";


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
      comptroller,
      cdai
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
  
    log(`Saving contracts ....`);
  

    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------");


    const comptrollerSubmission : DeploymentSubmission = {
      abi: comptrollerabi,
      address: comptroller
    }

    await save('ComptrollerCompound', comptrollerSubmission);
    let existingComptrollerCompound = await getOrNull('ComptrollerCompound');

    if(existingComptrollerCompound) {
      log(`Deployment Saved: ComptrollerCompound with address ${chalk.green(existingComptrollerCompound.address)}`);
    }

    const cDaiSubmission : DeploymentSubmission = {
      abi: ctokenabi,
      address: cdai
    }

    await save('CDaiCompound', cDaiSubmission);
    let existingCEtherCompound = await getOrNull('CDaiCompound');

    if(existingCEtherCompound) {
      log(`Deployment Saved: CDaiCompound with address ${chalk.green(existingCEtherCompound.address)}`);
    }



    
  
}
export default func;
func.tags = ["0-3-00","0-3","lending",'external'];
func.dependencies = ["amm"];

// func.skip = async (hre) => (await hre.deployments.getNetworkName()) == 'hardhat'; //skip when it is  hardhat


func.skip = async function (hre: HardhatRuntimeEnvironment) {


  //use for mainnet fork test,generate local host, or production

  //1) mainnet fork test    hre.network.name == 'hardhat' && isMainnetForking == true
  //2) generate local host  hre.network.name == 'localhost' && isMainnetForking == true
  //3) production           hre.network.name == 'bscMainnet' && isMainnetForking == false

 //not use for testnet, generate hardhat, unit test
  //1) testnet              hre.network.name == 'bscTestnet' && isMainnetForking == false
  //2) generate hardhat     hre.network.name == 'hardhat' && isMainnetForking == false
  //3) unit test            hre.network.name == 'hardhat' && isMainnetForking == false



  let isForking = process.env.HARDHAT_FORK == undefined ? false: true

  if( (hre.network.name == 'bsctestnet' && !isForking)
     || (hre.network.name == 'rinkeby' && !isForking) 
     || (hre.network.name == 'hardhat' && !isForking) ){
        return true;
    } else{
        return false;
    }


};