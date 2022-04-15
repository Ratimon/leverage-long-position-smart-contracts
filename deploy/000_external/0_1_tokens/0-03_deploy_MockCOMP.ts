import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

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
  const {deploy, execute , log } = deployments;
  const {deployer} = await getNamedAccounts();

  log(chalk.cyan(`.....`));
  log(chalk.cyan(`Starting Script.....`));

  log(`Deploying contracts with the account: ${deployer}`);


  const balance = await hre.ethers.provider.getBalance(deployer);
  log(`Account balance: ${formatUnits(balance, 'ether')} ETH`);


  log(chalk.yellow(`Network Name: ${network.name}`));
  log("----------------------------------------------------")



  const  ERC20Args : {[key: string]: any} = {}; 
  
  ERC20Args[`tokenName`] = "MockCOMP";

  const deploymentName = "TokenCOMP"
  const ERC20Result = await deploy(deploymentName, {
      contract: "MockERC20",
      from: deployer,
      args: Object.values(ERC20Args),
      log: true,
      skipIfAlreadyDeployed: true
    });
    
  log("------------------ii---------ii---------------------")
  log("----------------------------------------------------")
  log("------------------ii---------ii---------------------")
  log(`Could be found at ....`)
  log(chalk.yellow(`/deployment/${network.name}/${deploymentName}.json`))

  if (ERC20Result.newlyDeployed) {
    
    log(`contract address (MockERC20): ${chalk.green(ERC20Result.address)} using ${ERC20Result.receipt?.gasUsed} gas`);

    for(var i in ERC20Args){
      log(chalk.yellow( `Argument: ${i} - value: ${ERC20Args[i]}`));
    }

    await execute(
      deploymentName,
      {from: deployer, log: true},
      "mint",
      deployer,
      parseEther('2000000')
      );

    if(hre.network.tags.production || hre.network.tags.staging){

      try {
          
          await hre.run("verify:verify", {
              address: ERC20Args.address,
              constructorArguments: Object.values(ERC20Args),
          });

          }
      catch(err) {
          console.log(err)
      }
    }
    
  }

  log(chalk.cyan(`Ending Script.....`));
  log(chalk.cyan(`.....`)); 

    
}
export default func;
func.tags = ["0-1-03","0-1","comp","token",'external'];
func.dependencies = ["0-1-02"];



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