import chalk from 'chalk';
import {expect} from './chai-setup';
import {ethers, web3, waffle, deployments, getUnnamedAccounts} from 'hardhat';
import {IERC20, ChainlinkOracleWrapper,IUniswapV2Router, ICToken, ICEther,IComptroller, LongPosition} from '../typechain';
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
        RouterUniswap: <IUniswapV2Router>await ethers.getContract('RouterUniswap'),
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

describe('LongPosition: closePosition', function () {
  
  const DAY: BigNumber = BigNumber.from(24 * 60 * 60);
  const MONTH: BigNumber =  BigNumber.from(30*24 * 60 * 60);
  const YEAR: BigNumber =  BigNumber.from(365*24 * 60 * 60);

  let accounts : any;
  let users : any;

  let TokenWETH: IERC20;
  let TokenDAI: IERC20;
  let RouterUniswap: IUniswapV2Router;

//   let ComptrollerCompound: IComptroller;
  let CEtherCompound: ICEther;
  let LongETHPosition: LongPosition;

  before(async () => {

    const fixture = await setup();

    accounts = fixture.accounts;
    users = fixture.users;

    TokenWETH = fixture.TokenWETH;
    TokenDAI = fixture.TokenDAI;
    RouterUniswap = fixture.RouterUniswap;
    // ComptrollerCompound = fixture.ComptrollerCompound;
    CEtherCompound= fixture.CEtherCompound;
    LongETHPosition= fixture.LongETHPosition;    


  })

  it("should openPosition() ", async function () {

    // at block 14518731
    // let top3WethAddress = '0xe2008b01a2ad0a9aeea9f71ecc6a176138553a61';
    // await setERC20Balance(top3WethAddress, accounts.deployer.address, amountToProvide, TokenWETH);
    await depositGas(accounts.deployer.address, 2)

    const DeployerETHBalanceBefore =  await provider.getBalance(accounts.deployer.address);
    const ETHbalanceInLongPositionBefore = await provider.getBalance(LongETHPosition.address);

    let options = {value: parseEther("1.0")}

    await (accounts.deployer.LongETHPosition as LongPosition).openPosition(options)

    const DeployerETHBalanceAfter =  await provider.getBalance(accounts.deployer.address);
    const ETHbalanceInLongPositionAfter = await provider.getBalance(LongETHPosition.address);

    const leverage =  await LongETHPosition.leverage()
    const BASIS_POINTS_GRANULARITY =  await LongETHPosition.BASIS_POINTS_GRANULARITY()

    const DeployerETHBalanceInvestment = DeployerETHBalanceBefore.sub(DeployerETHBalanceAfter)

    const borrowedAmountInETH = DeployerETHBalanceInvestment.mul(leverage)
      .div(BASIS_POINTS_GRANULARITY)

    const IncreaseInETHBalancePosition = ETHbalanceInLongPositionAfter.sub(ETHbalanceInLongPositionBefore)

    console.log(`IncreaseInETHBalancePosition`, chalk.blue(formatUnits(IncreaseInETHBalancePosition)));
    console.log(`IncreaseInETHBalancePosition parse`, chalk.blue(parseFloat(formatUnits(IncreaseInETHBalancePosition.toString(),16))));

    console.log(`DeployerETHBalanceInvestment`, chalk.blue(formatUnits(borrowedAmountInETH)));
    console.log(`DeployerETHBalanceInvestment parse`, chalk.blue(parseFloat(formatUnits(borrowedAmountInETH.toString(),16))));

    expect(parseFloat(formatUnits(IncreaseInETHBalancePosition.toString(),16)))
      .to.closeTo(parseFloat(formatUnits(borrowedAmountInETH.toString(),16)),0.1)

  })

  it("should advance block time and ETH should increase", async function () {

    await advanceTimeAndBlock(7*DAY.toNumber());

    let amountToProvide = 500000000; //500_000_000 DAI

    // at block 14518731
    // let top3DaiAddress = '0x5D38B4e4783E34e2301A2a36c39a03c45798C4dD';
    let top3DaiAddress = '0xE78388b4CE79068e89Bf8aA7f218eF6b9AB0e9d0';

    
    await depositGas(top3DaiAddress, 1)
    await setERC20Balance(top3DaiAddress, users[0].address, amountToProvide, TokenDAI);

    await (users[0].TokenDAI as IERC20).approve(RouterUniswap.address,"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    await (users[0].RouterUniswap as IUniswapV2Router).swapExactTokensForETH(
      parseEther(`${amountToProvide}`),
      parseEther('0'),
      [TokenDAI.address,TokenWETH.address],
      users[0].address,
      Date.now() + 1000 * 60 * 10,
    )



  })



})