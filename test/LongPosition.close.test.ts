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
        TokenCOMP: <IERC20>await ethers.getContract('TokenCOMP'),
        RouterUniswap: <IUniswapV2Router>await ethers.getContract('RouterUniswap'),
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

  it("should not closePosition() if current position is not active ", async function () {

    const {users} = await setup();

    await depositGas(users[0].address, 1);

    await expect(

      (users[1].LongETHPosition as LongPosition).closePosition()

    ).to.be.revertedWith("current position must be active");


  })

  it("should not closePosition() if someone else is closing the position ", async function () {

    const {users} = await setup();

    await depositGas(users[0].address, 2);
    await depositGas(users[1].address, 2);

    let options = {value: parseEther("1.0")};
    await (users[0].LongETHPosition as LongPosition).openPosition(options);

    await expect( 

      (users[1].LongETHPosition as LongPosition).closePosition()

    ).to.be.revertedWith("only position owner can withdraw");


  })


  it("should not closePosition() if owner has closed the position again ", async function () {

    const {users, TokenWETH, TokenDAI, RouterUniswap} = await setup();

    await depositGas(users[0].address, 2);

    let options = {value: parseEther("1.0")};
    await (users[0].LongETHPosition as LongPosition).openPosition(options);


    //////////////////////////////ETH price Increases

    await advanceTimeAndBlock(7*MONTH.toNumber());
    let amountToProvide = 20000000; //20_000_000 DAI
  
    // at block 14518731
    let top3DaiAddress = '0xE78388b4CE79068e89Bf8aA7f218eF6b9AB0e9d0'; // mainnet
    // at block 9518731
    // let top3DaiAddress = '0xcea4e535d03086dbaa04c71675129654e92cc055'; // rinkedby

    
    await depositGas(top3DaiAddress, 1)
    await setERC20Balance(top3DaiAddress, users[11].address, amountToProvide, TokenDAI);
  
    await (users[11].TokenDAI as IERC20).approve(RouterUniswap.address,"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  
    await (users[11].RouterUniswap as IUniswapV2Router).swapExactTokensForETH(
      parseEther(`${amountToProvide}`),
      parseEther('0'),
      [TokenDAI.address,TokenWETH.address],
      users[11].address,
      Date.now() + 1000 * 60 * 10,
    )

    await (users[0].LongETHPosition as LongPosition).closePosition();


    await expect( 

      (users[0].LongETHPosition as LongPosition).closePosition()

    ).to.be.revertedWith("current position must be active");

    


  })

  it("should closePosition() ", async function () {

    const {accounts, users,TokenWETH, TokenDAI, TokenCOMP,RouterUniswap, CEtherCompound,CDaiCompound, LongETHPosition} = await setup();

    // at block 14518731
    // let top3WethAddress = '0xe2008b01a2ad0a9aeea9f71ecc6a176138553a61';
    // await setERC20Balance(top3WethAddress, accounts.deployer.address, amountToProvide, TokenWETH);

    ///////////////////////////////OpenPosition

    await depositGas(users[0].address, 2)
    let options = {value: parseEther("1.0")}
    await (users[0].LongETHPosition as LongPosition).openPosition(options);



    //////////////////////////////ETH price Increases

    await advanceTimeAndBlock(7*MONTH.toNumber());
    let amountToProvide = 20000000; //20_000_000 DAI

    // at block 14518731
    let top3DaiAddress = '0x5D38B4e4783E34e2301A2a36c39a03c45798C4dD';
    // let top3DaiAddress = '0xE78388b4CE79068e89Bf8aA7f218eF6b9AB0e9d0';
        // at block 9518731
    // let top3DaiAddress = '0xcea4e535d03086dbaa04c71675129654e92cc055'; // rinkedby

    await depositGas(top3DaiAddress, 1)
    await setERC20Balance(top3DaiAddress, users[11].address, amountToProvide, TokenDAI);

    await (users[11].TokenDAI as IERC20).approve(RouterUniswap.address,"0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

    await (users[11].RouterUniswap as IUniswapV2Router).swapExactTokensForETH(
      parseEther(`${amountToProvide}`),
      parseEther('0'),
      [TokenDAI.address,TokenWETH.address],
      users[11].address,
      Date.now() + 1000 * 60 * 10,
    )

    const expectedUniSwapOutput =  await LongETHPosition.getExpectedUniSwapOutput();
    const currentETHPrice =  await LongETHPosition.getCurrentETHPrice();
    const totalExposure =  await LongETHPosition.getTotalExposure();
    const expectedProfitInUsd =  await LongETHPosition.getExpectedProfitInUsd();

    console.log('expectedUniSwapOutput', formatUnits( expectedUniSwapOutput , 18));
    console.log('currentETHPrice', formatUnits( currentETHPrice , 0));

    console.log('totalExposure', formatUnits( totalExposure , 18));
    console.log('expectedProfitInUsd', formatUnits( expectedProfitInUsd , 18));


    //////////////////////////////ClosePosition

    const UserETHBalanceBefore =  await provider.getBalance(users[0].address);
    const ETHbalanceInLongPositionBefore = await provider.getBalance(LongETHPosition.address);
    const UserDaiBalanceBefore =  await TokenDAI.balanceOf(users[0].address);
    const UserCompBalanceBefore =  await TokenCOMP.balanceOf(users[0].address);


    await (users[0].LongETHPosition as LongPosition).closePosition();


    const UserETHBalanceAfter =  await provider.getBalance(users[0].address);
    const ETHbalanceInLongPositionAfter = await provider.getBalance(LongETHPosition.address);
    const UserDaiBalanceAfter =  await TokenDAI.balanceOf(users[0].address);
    const UserCompBalanceAfter =  await TokenCOMP.balanceOf(users[0].address);

    const leverage =  await LongETHPosition.leverage()
    const BASIS_POINTS_GRANULARITY =  await LongETHPosition.BASIS_POINTS_GRANULARITY()

    const withdrawedETHBalance = UserETHBalanceAfter.sub(UserETHBalanceBefore)

    const borrowedAmountInETH = withdrawedETHBalance.mul(leverage)
      .div(BASIS_POINTS_GRANULARITY)

    const DecreaseInETHBalancePosition = ETHbalanceInLongPositionBefore.sub(ETHbalanceInLongPositionAfter);

    expect(parseFloat(formatUnits(DecreaseInETHBalancePosition.toString(),16)))
      .to.closeTo(parseFloat(formatUnits(borrowedAmountInETH.toString(),16)),0.1);

    const ProfitInDai = UserDaiBalanceAfter.sub(UserDaiBalanceBefore);
    const BonusInComp = UserCompBalanceAfter.sub(UserCompBalanceBefore);


    const  isPoitionActive =  await LongETHPosition.isCurrentPositionActive();
    expect(isPoitionActive).to.equal(false);



    // console.log('withdrawedETHBalance', formatUnits( withdrawedETHBalance , 18))
    // console.log('DecreaseInETHBalancePosition', formatUnits( DecreaseInETHBalancePosition , 18))
    // console.log('ProfitInDai', formatUnits( ProfitInDai , 18))

    //adjusted for gas
    expect(withdrawedETHBalance.add(DecreaseInETHBalancePosition)).to.be.closeTo(totalExposure,5000000000000000)
    expect(ProfitInDai).to.be.closeTo(expectedProfitInUsd,200000000000000);
    // expect(ProfitInDai).to.be.gt(parseEther('0'));
    expect(BonusInComp).to.be.gt(parseEther('0'));



  })



})