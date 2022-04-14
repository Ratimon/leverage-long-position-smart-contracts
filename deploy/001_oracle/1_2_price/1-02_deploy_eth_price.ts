import 'dotenv/config';


import chalk from 'chalk';


import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';


import {
    utils,
} from 'ethers';

const { 
    formatUnits,
} = utils;


  
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const {deployments, getNamedAccounts, network} = hre;
    const {deploy,execute, get, log, read } = deployments;

    const {
        deployer
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
    
    log(`Deploying contracts with the account: ${deployer}`);
    
    
    const balance = await hre.ethers.provider.getBalance(deployer);
    log(`Account balance: ${formatUnits(balance, 'ether')} BNB`);
    
    
    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------");
    


    let oracleAddress;
    let backupOracleAddress;
    let isInvert;


    oracleAddress = (await get('OracleChainlinkWrapper_USD_per_ETH')).address;
    backupOracleAddress = (await get('OracleChainlinkWrapper_USD_per_ETH')).address;
    isInvert = false


    
    const  Args : {[key: string]: any} = {};


    Args[`oracle`] = oracleAddress;
    Args[`backupOracle`] = backupOracleAddress;
    Args[`isInvert`] = isInvert;


    const deploymentName = "OraclePriceETH"
    const Result = await deploy(deploymentName, {
        contract: "PriceOracle", 
        from: deployer,
        args: Object.values(Args),
        log: true,
        deterministicDeployment: false
    });


    log("------------------ii---------ii---------------------")
    log("----------------------------------------------------")
    log("------------------ii---------ii---------------------")
    log(`Could be found at ....`)
    log(chalk.yellow(`/deployment/${network.name}/${deploymentName}.json`))

    
    if (Result.newlyDeployed) {

        log(` contract address: ${chalk.green(Result.address)} using ${Result.receipt?.gasUsed} gas`);

        for(var i in Args){
            log(chalk.yellow( `Argument: ${i} - value: ${Args[i]}`));
          }


        if(hre.network.tags.production || hre.network.tags.staging){

            try {
                    
                await hre.run("verify:verify", {
                    address: Result.address,
                    constructorArguments: Object.values(Args),
                });
            }
            catch(err) {
                console.log(err)
            }

        }

        let peg = await read(deploymentName,"readOracle")


        log(`Price : ${chalk.green(peg)}`);


    }

    log(chalk.cyan(`Ending Script.....`));
    log(chalk.cyan(`.....`));




  
};
export default func;
func.tags = ["1-2-2","1-2", 'eth-price','oracle'];
func.dependencies = ["1-2-1"]