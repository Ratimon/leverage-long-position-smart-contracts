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
    
    let wethAddress;
    let routerAddress;
    let comptrollerAddress;
    let cEtherAddress;
    let borrowOracleAddress;
    let supplyOracleAddress;
    let cTokenToSupplyAddress;
    let cTokenToBorrowAddress

    wethAddress = (await get('TokenWETH')).address;
    routerAddress = (await get('RouterUniswap')).address;
    comptrollerAddress = (await get('ComptrollerCompound')).address;
    cEtherAddress = (await get('CEtherCompound')).address;
    borrowOracleAddress = (await get('OraclePriceDAI')).address;
    supplyOracleAddress = (await get('OraclePriceETH')).address;
    cTokenToSupplyAddress = (await get('CEtherCompound')).address;
    cTokenToBorrowAddress = (await get('CDaiCompound')).address;

    
    const  Args : {[key: string]: any} = {};

    Args[`router`] = routerAddress;
    Args[`comptroller`] = comptrollerAddress;
    Args[`cEther`] = cEtherAddress;
    Args[`borrowOracle`] = borrowOracleAddress;
    Args[`supplyOracle`] = supplyOracleAddress;
    Args[`cTokenToSupply`] = cTokenToSupplyAddress;
    Args[`cTokenToBorrow`] = cTokenToBorrowAddress;


    const deploymentName = "LongETHPosition"
    const Result = await deploy(deploymentName, {
        contract: "LongPosition", 
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


    }

    log(chalk.cyan(`Ending Script.....`));
    log(chalk.cyan(`.....`));




  
};
export default func;
func.tags = ["2-0-01","2-0", 'longETH','protocol'];
func.dependencies = ["oracle"]