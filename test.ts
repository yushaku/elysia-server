import { DateTime } from 'luxon';
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

const createDeterministicMessage = (data: any): string => {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result: any, key) => {
      result[key] = data[key];
      return result;
    }, {});

  return JSON.stringify(sortedData);
};

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
});

const data = {
  address: account.address,
  nonce: 1,
  timestamp: DateTime.now().toMillis(),
};

const message = createDeterministicMessage(data);

const signature = await client.signMessage({
  message,
});

console.log({
  ...data,
  message,
  signature,
});
