import chalk from 'chalk';
import {expect} from './chai-setup';
import {ethers, web3, waffle, deployments, getUnnamedAccounts} from 'hardhat';
import {IERC20, ChainlinkOracleWrapper, ICToken, ICEther, LongPosition} from '../typechain';
import * as hre from 'hardhat';
import {BigNumber, BigNumberish, ContractTransaction, constants, utils} from 'ethers';
// @ts-ignore
import {BN} from '@openzeppelin/test-helpers'
const { parseEther,formatUnits,keccak256,} = utils;

import {setupUsers, setupNamedUsers} from './setup';
import { advanceTimeAndBlock,depositGas,setBalance, setERC20Balance} from "./utils";

const provider = waffle.provider;
const wei = web3.utils.toWei;

const setup = deployments.createFixture(async () => {
    await deployments.fixture(['external', 'oracle', 'protocol']);
    const contracts = {
        TokenWETH: <IERC20>await ethers.getContract('TokenWETH'),
        TokenDAI: <IERC20>await ethers.getContract('TokenDAI'),
        OracleChainlinkWrapper_USD_per_ETH: <ChainlinkOracleWrapper>await ethers.getContract('OracleChainlinkWrapper_USD_per_ETH'),
        CEtherCompound: <ICEther>await ethers.getContract('CEtherCompound'),
        CDaiCompound: <ICToken>await ethers.getContract('CDaiCompound'),
        LongETHPosition: <LongPosition>await ethers.getContract('LongETHPosition'),
    };

    //@ts-ignore 
    const users = await setupUsers(await getUnnamedAccounts(), contracts);
    //@ts-ignore
    const accounts = await setupNamedUsers(await getNamedAccounts(), contracts);

    return {
      ...contracts,
      users,
      accounts
    };
  });

describe('LongPosition: openPosition', function () {
  
  const DAY: BigNumber = BigNumber.from(24 * 60 * 60);
  const MONTH: BigNumber =  BigNumber.from(30*24 * 60 * 60)
  const YEAR: BigNumber =  BigNumber.from(365*24 * 60 * 60)

  it("should openPosition() ", async function () {

    const {accounts, users, TokenWETH,TokenDAI, OracleChainlinkWrapper_USD_per_ETH, CEtherCompound,CDaiCompound, LongETHPosition} = await setup();

    // let amountToProvide = 10; //10 eth

    // at block 14518731
    // let top3WethAddress = '0xe2008b01a2ad0a9aeea9f71ecc6a176138553a61';
    // await setERC20Balance(top3WethAddress, accounts.deployer.address, amountToProvide, TokenWETH);
    await depositGas(accounts.deployer.address, 2)


    let DeployerAsSigner  = await hre.ethers.provider.getSigner(accounts.deployer.address);

    const DeployerETHBalanceBefore =  await provider.getBalance(accounts.deployer.address);
    // const DeployerWethBalanceBefore =  await TokenWETH.balanceOf(accounts.deployer.address);
    const VaultcEtherBalanceBefore =  await CEtherCompound.balanceOf(LongETHPosition.address);
    // const exchangeRateBefore =  await CEtherCompound.exchangeRateCurrent();

    const ETHbalanceInLongPositionBefore = await provider.getBalance(LongETHPosition.address);

    // const  USDPerETH = await OracleChainlinkWrapper_USD_per_ETH.read();



    console.log(`DeployerETHBalanceBefore`, chalk.blue(formatUnits(DeployerETHBalanceBefore)));
    // console.log(`DepsloyerWethBalanceBefore`, chalk.blue(formatUnits(DeployerWethBalanceBefore)));
    //@ts-ignore 
    // console.log(`exchangeRateBefore`, chalk.blue(formatUnits(exchangeRateBefore)));
    console.log(`ETHbalanceInLongPositionBefore`, chalk.blue(formatUnits(ETHbalanceInLongPositionBefore)));
    // console.log(`USDPerETH`, chalk.blue(formatUnits(USDPerETH)));
    // console.log(`USDPerETH`, chalk.blue(USDPerETH));


    // await (accounts.deployer.TokenWETH as IERC20).approve( LongETHPosition.address,"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    let options = {value: parseEther("1.0")}

    await (accounts.deployer.LongETHPosition as LongPosition).openPosition(options)

    // const DeployerETHBalanceAfter =  await DeployerAsSigner.getBalance();
    const DeployerETHBalanceAfter =  await provider.getBalance(accounts.deployer.address);
    // const DeployerWethBalanceAfter =  await TokenWETH.balanceOf(accounts.deployer.address);
    const VaultcEtherBalanceAfter =  await CEtherCompound.balanceOf(LongETHPosition.address);
    const totalBorrowsAfter=  await CEtherCompound.totalBorrows();

    const VaultBorrowBalanceStoredAfter=  await CDaiCompound.borrowBalanceStored(LongETHPosition.address);

    const VaultSuppliedBalanceAfter=  await CEtherCompound.balanceOfUnderlying(LongETHPosition.address);
    // const VaultSuppliedBalanceAfterr_ = new BN(wei(VaultSuppliedBalanceAfter.toString(),'wei' ));

    const ETHbalanceInLongPositionAfter = await provider.getBalance(LongETHPosition.address);


    const leverage =  await LongETHPosition.leverage()
    const BASIS_POINTS_GRANULARITY =  await LongETHPosition.BASIS_POINTS_GRANULARITY()

    const DeployerETHBalanceInvestment = DeployerETHBalanceBefore.sub(DeployerETHBalanceAfter)

    const borrowedAmountInETH = DeployerETHBalanceInvestment.mul(leverage)
      .div(BASIS_POINTS_GRANULARITY)


    console.log(`DeployerETHBalanceAfter`, chalk.blue(formatUnits(DeployerETHBalanceAfter)));
    // console.log(`DeployerWethBalanceBefore`, chalk.blue(formatUnits(DeployerWethBalanceAfter)));
    console.log(`VaultcEtherBalanceAfter`, chalk.blue(formatUnits(VaultcEtherBalanceAfter)));

    //@ts-ignore 
    console.log(`totalBorrowsAfter`, chalk.blue(formatUnits(totalBorrowsAfter)));
    //@ts-ignore 
    console.log(`VaultBorrowBalanceCurrentAfter`, chalk.blue(formatUnits(VaultBorrowBalanceStoredAfter)));
    //@ts-ignore 
    // console.log(`VaultSuppliedBalanceStoredAfter`, chalk.blue(VaultSuppliedBalanceAfterr_));
    // console.log(`VaultSuppliedBalanceStoredAfter`, chalk.blue(formatUnits(VaultSuppliedBalanceAfterr_.toString(),18)));
    // console.log(`VaultSuppliedBalanceStoredAfter`, chalk.blue(VaultSuppliedBalanceAfter));


    console.log(`ETHbalanceInLongPositionAfter`, chalk.blue(formatUnits(ETHbalanceInLongPositionAfter)));
    console.log(`ETHbalanceInLongPositionAfter parse`, chalk.blue(parseFloat(formatUnits(ETHbalanceInLongPositionAfter.toString(),16))));

    console.log(`DeployerETHBalanceInvestment`, chalk.blue(formatUnits(borrowedAmountInETH)));

    // expect(ETHbalanceInLongPositionAfter).to.equal(borrowedAmountInETH);

    expect(parseFloat(formatUnits(ETHbalanceInLongPositionAfter.toString(),16)))
      .to.closeTo(parseFloat(formatUnits(borrowedAmountInETH.toString(),16)),0.1)



  })



})