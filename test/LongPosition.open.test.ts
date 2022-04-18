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
        TokenDAI: <IERC20>await ethers.getContract('TokenDAI'),
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
  const MONTH: BigNumber =  BigNumber.from(30*24 * 60 * 60);
  const YEAR: BigNumber =  BigNumber.from(365*24 * 60 * 60);

  it("should not openPosition() if no ETH is sent along ", async function () {

    const {users} = await setup();

    await depositGas(users[0].address, 3);


    let options = {value: parseEther("0")};
    await expect( 

      (users[0].LongETHPosition as LongPosition).openPosition(options)

    ).to.be.revertedWith("must send arbitary amount of ether along with");



  })

  it("should not openPosition() if current position is not active ", async function () {

    const {users} = await setup();

    await depositGas(users[0].address, 3);
    await depositGas(users[1].address, 3);

    let options = {value: parseEther("1.0")};
    await (users[0].LongETHPosition as LongPosition).openPosition(options);

    options = {value: parseEther("1.5")};
    await expect( 

      (users[1].LongETHPosition as LongPosition).openPosition(options)

    ).to.be.revertedWith("position is already active");

    options = {value: parseEther("1.5")};
    await expect( 

      (users[0].LongETHPosition as LongPosition).openPosition(options)

    ).to.be.revertedWith("position is already active");

  })

  it("should openPosition() ", async function () {

    const {accounts, users, TokenDAI, CEtherCompound,CDaiCompound, LongETHPosition} = await setup();

    await depositGas(users[0].address, 2)

    const UserETHBalanceBefore =  await provider.getBalance(users[0].address);
    const ETHbalanceInLongPositionBefore = await provider.getBalance(LongETHPosition.address);


    let options = {value: parseEther("1.0")}
    await (users[0].LongETHPosition as LongPosition).openPosition(options)


    const UserETHBalanceAfter =  await provider.getBalance(users[0].address);
    const ETHbalanceInLongPositionAfter = await provider.getBalance(LongETHPosition.address);

    const leverage =  await LongETHPosition.leverage()
    const BASIS_POINTS_GRANULARITY =  await LongETHPosition.BASIS_POINTS_GRANULARITY()

    const DepositedETHBalance = UserETHBalanceBefore.sub(UserETHBalanceAfter)

    const borrowedAmountInETH = DepositedETHBalance.mul(leverage)
      .div(BASIS_POINTS_GRANULARITY)

    const IncreaseInETHBalancePosition = ETHbalanceInLongPositionAfter.sub(ETHbalanceInLongPositionBefore)

    const  isPoitionActive =  await LongETHPosition.isCurrentPositionActive();

    expect(isPoitionActive).to.equal(true);



    // console.log(`IncreaseInETHBalancePosition`, chalk.blue(formatUnits(IncreaseInETHBalancePosition)));
    // console.log(`IncreaseInETHBalancePosition parse`, chalk.blue(parseFloat(formatUnits(IncreaseInETHBalancePosition.toString(),16))));

    // console.log(`DeployerETHBalanceInvestment`, chalk.blue(formatUnits(borrowedAmountInETH)));
    // console.log(`DeployerETHBalanceInvestment parse`, chalk.blue(parseFloat(formatUnits(borrowedAmountInETH.toString(),16))));

    expect(parseFloat(formatUnits(IncreaseInETHBalancePosition.toString(),16)))
      .to.closeTo(parseFloat(formatUnits(borrowedAmountInETH.toString(),16)),0.1)

  })






})