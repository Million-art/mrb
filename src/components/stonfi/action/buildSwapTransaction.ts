import type { SwapSimulation } from "@ston-fi/api";
import {
  type AddressType,
  type AmountType,
  type QueryIdType,
  dexFactory,
} from "@ston-fi/sdk";
import type { SendTransactionRequest } from "@tonconnect/ui-react";

import { getRouter } from "@/libs/routersRepository";
import { tonApiClient } from "@/libs/tonApiClient";

import { TON_ADDRESS } from "@/constants";

const getSwapTxParams = async (
  simulation: SwapSimulation,
  walletAddress: string,
  params?: {
    queryId?: QueryIdType;
    referralAddress?: AddressType;
    referralValue?: AmountType;
  },
) => {
  const routerMetadata = await getRouter(simulation.routerAddress);

  if (!routerMetadata) {
    throw new Error(`Router ${simulation.routerAddress} not found`);
  }

  const dexContracts = dexFactory(routerMetadata);

  const router = tonApiClient.open(
    dexContracts.Router.create(routerMetadata.address),
  );

  if (
    simulation.askAddress !== TON_ADDRESS &&
    simulation.offerAddress !== TON_ADDRESS
  ) {
    return router.getSwapJettonToJettonTxParams({
      userWalletAddress: walletAddress,
      offerJettonAddress: simulation.offerAddress,
      offerAmount: simulation.offerUnits,
      askJettonAddress: simulation.askAddress,
      minAskAmount: simulation.minAskUnits,
      ...params,
    });
  }

  const proxyTon = dexContracts.pTON.create(routerMetadata.ptonMasterAddress);

  if (simulation.offerAddress === TON_ADDRESS) {
    return router.getSwapTonToJettonTxParams({
      userWalletAddress: walletAddress,
      proxyTon,
      offerAmount: simulation.offerUnits,
      askJettonAddress: simulation.askAddress,
      minAskAmount: simulation.minAskUnits,
      ...params,
    });
  }

  return router.getSwapJettonToTonTxParams({
    userWalletAddress: walletAddress,
    proxyTon,
    offerAmount: simulation.offerUnits,
    offerJettonAddress: simulation.offerAddress,
    minAskAmount: simulation.minAskUnits,
    ...params,
  });
};

export const buildSwapTransaction = async (
  simulation: SwapSimulation,
  walletAddress: string,
  params?: {
    queryId?: QueryIdType;
    referralAddress?: AddressType;
    referralValue?: AmountType;
  },
) => {
  const txParams = await getSwapTxParams(simulation, walletAddress, params);

  const messages: SendTransactionRequest["messages"] = [
    {
      address: txParams.to.toString(),
      amount: txParams.value.toString(),
      payload: txParams.body?.toBoc().toString("base64"),
    },
  ];

  return messages;
};