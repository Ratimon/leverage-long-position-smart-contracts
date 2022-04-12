import { BigNumber } from '@ethersproject/bignumber';

import {
    IERC20,
  } from '../../typechain';


export async function transfer_token(reciever: string, amount : BigNumber, UnderlyingToken : IERC20 ) {
  
    let BalanceAfter: BigNumber
    await UnderlyingToken.transfer(reciever, amount);
    BalanceAfter = await UnderlyingToken.balanceOf(reciever);
    return BalanceAfter;

    };