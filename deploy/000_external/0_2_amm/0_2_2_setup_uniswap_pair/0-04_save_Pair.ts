import 'dotenv/config';

import chalk from 'chalk';

import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {
    DeployFunction,
    DeploymentSubmission
} from 'hardhat-deploy/types';

import {
    utils,
} from 'ethers';

const { 
    formatUnits,
} = utils;

import pairabi from "../../../../assets/abis/external/uni-pair.json";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

    const {deployments, getNamedAccounts, network} = hre;
    const {deploy,execute, get, getOrNull, log, read, save } = deployments;

    const {
        deployer,
        dev
    } = await getNamedAccounts();

    log(chalk.cyan(`.....`));
    log(chalk.cyan(`Starting Script.....`));
    

    
    
    log(chalk.yellow(`Network Name: ${network.name}`));
    log("----------------------------------------------------"); 

    let wethAddress: string;
    let daiAddress: string;
    let pairAddress: string;

    wethAddress  = (await get('TokenWETH')).address;
    daiAddress  = (await get('TokenDAI')).address;

    

    let existingPair = await getOrNull('pairWethDai');

    if(!existingPair) {

        pairAddress = await read('FactoryUniswap','getPair',
            wethAddress,
            daiAddress
        )
        if(pairAddress == '0x0000000000000000000000000000000000000000' ) {
            await execute(
                'FactoryUniswap',
                {from: deployer, log: true}, 
                "createPair",
                wethAddress,
                daiAddress
                );
        }

        pairAddress = await read( 'FactoryUniswap', 'getPair',
            wethAddress,
            daiAddress
        )

        const pairSubmission : DeploymentSubmission = {
            abi: pairabi,
            address: pairAddress
        }
    
    
        await save('pairWethDai', pairSubmission);

        let existingPair = await getOrNull('pairWethDai');

        if(existingPair) {
            log(`Deployment Saved: pairWethDai with address ${chalk.green(existingPair.address)}`);
        }

        const isForking = process.env.HARDHAT_FORK == undefined ? false: true

        if(!isForking) {
            const initCodePairHash = await read(
                'FactoryUniswap',
                'INIT_CODE_PAIR_HASH'
            )

            log(`We ${chalk.red(`need to`)} modify initial code hash in ${chalk.yellow(`function pairFor of UniswapV2Library.sol`)} to be the same as :initCodePairHash:`,chalk.green(initCodePairHash));
        } 

    }

    log(chalk.cyan(`Ending Script.....`));
    log(chalk.cyan(`.....`));
};
export default func;
func.tags = ["0-2-2-04", "0-2-1","pair-uniswap", "external"];
func.dependencies = ["0-2-1-02"];
