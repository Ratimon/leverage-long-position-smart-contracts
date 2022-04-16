import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {
  DeployFunction,
  DeploymentSubmission
} from 'hardhat-deploy/types';

import comptrollerabi from "../../../assets/abis/external/comptroller.json";
import cetherabi from "../../../assets/abis/external/cether.json";
import ctokenabi from "../../../assets/abis/external/ctoken.json";


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
      cether,
      cdai,
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

    const cEtherSubmission : DeploymentSubmission = {
      abi: cetherabi,
      address: cether
    }

    await save('CEtherCompound', cEtherSubmission);
    let existingCEtherCompound = await getOrNull('CEtherCompound');

    if(existingCEtherCompound) {
      log(`Deployment Saved: CEtherCompound with address ${chalk.green(existingCEtherCompound.address)}`);
    }

    const cDaiSubmission : DeploymentSubmission = {
      abi: ctokenabi,
      address: cdai
    }

    await save('CDaiCompound', cDaiSubmission);
    let existingCDaiCompound = await getOrNull('CDaiCompound');

    if(existingCDaiCompound) {
      log(`Deployment Saved: CDaiCompound with address ${chalk.green(existingCDaiCompound.address)}`);
    }



    
  
}
export default func;
func.tags = ["0-3-00","0-3","lending",'external'];
func.dependencies = ["amm"];

// func.skip = async (hre) => (await hre.deployments.getNetworkName()) == 'hardhat'; //skip when it is  hardhat


func.skip = async function (hre: HardhatRuntimeEnvironment) {


  //use for mainnet fork test,generate local host, or production / testnet

  //1) mainnet fork test    hre.network.name == 'hardhat' && isMainnetForking == true
  //2) generate local host  hre.network.name == 'localhost' && isMainnetForking == true
  //3) production           hre.network.name == 'bscMainnet' && isMainnetForking == false
  //4) testnet              hre.network.name == 'bscTestnet' && isMainnetForking == false


 //not use for testnet, generate hardhat, unit test
  //1) generate hardhat     hre.network.name == 'hardhat' && isMainnetForking == false
  //2) unit test            hre.network.name == 'hardhat' && isMainnetForking == false



  let isForking = process.env.HARDHAT_FORK == undefined ? false: true

  if(  (hre.network.name == 'hardhat' && !isForking) ){
        return true;
    } else{
        return false;
    }


};