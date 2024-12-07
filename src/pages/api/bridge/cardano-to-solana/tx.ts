import type { NextApiRequest, NextApiResponse } from 'next';
import blockfrost from '@/utils/blockfrost';
// import { firestore } from '@/utils/firebase'
// import formatTokenAmount from '@/functions/formatTokenAmount'
import { ADA_BRIDGE_APP_ADDRESS, TRTL_COIN } from '@/constants';

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req;

  try {
    switch (method) {
      case 'POST': {
        const { txHash } = body;
        const { inputs, outputs } = await blockfrost.txsUtxos(txHash);
        const received: Record<string, number> = {};

        inputs.forEach((inp) => {
          const from = inp.address;

          outputs.forEach((outp) => {
            const to = outp.address;

            if (to === ADA_BRIDGE_APP_ADDRESS) {
              outp.amount.forEach(({ unit, quantity }) => {
                if (unit === TRTL_COIN['CARDANO']['TOKEN_ID']) {
                  if (received[from]) {
                    received[from] += +quantity;
                  } else {
                    received[from] = +quantity;
                  }
                }
              });
            }
          });
        });

        const objEntries = Object.entries(received);

        if (!objEntries.length) {
          return res.status(400).end('TX does not match bridge conditions');
        } else if (objEntries.length > 1) {
          return res.status(400).end('TX has too many matching bridge conditions');
        }

        const [[senderAddress, sentAmount]] = objEntries;

        // const walletsCollection = firestore.collection('linked-wallets')
        // const bridgeCollection = firestore.collection('trtl-bridge-to-sol')

        // const { docs } = await walletsCollection.where('cardano', '==', senderAddress).get()

        // if (!docs.length) {
        //   return res.status(400).end('Sender does not have a linked wallet')
        // } else if (docs.length > 1) {
        //   return res.status(400).end('Sender has too many linked wallets')
        // }

        // const { solana: solAddress } = docs[0].data()

        // if (!solAddress) {
        //   return res.status(400).end('Sender does not have a linked wallet')
        // }

        // const solAmount = Math.floor(
        //   formatTokenAmount.toChain(
        //     formatTokenAmount.fromChain(sentAmount / (TRTL_COIN['CARDANO']['CIRCULATING'] / TRTL_COIN['SOLANA']['CIRCULATING']), TRTL_COIN['CARDANO']['DECIMALS']),
        //     TRTL_COIN['SOLANA']['DECIMALS']
        //   )
        // )

        // const { empty } = await bridgeCollection.where('adaTxHash', '==', txHash).get()

        // if (!empty) {
        //   return res.status(400).end('This TX hash is already used')
        // }

        // const { id } = await bridgeCollection.add({
        //   adaTxHash: txHash,
        //   adaAddress: senderAddress,
        //   adaAmount: sentAmount,
        //   solAddress,
        //   solAmount,
        //   done: false,
        // })

        const id = '';

        return res.status(201).json({ id });
      }

      default: {
        res.setHeader('Allow', 'POST');
        return res.status(405).end();
      }
    }
  } catch (error) {
    console.error(error);

    return res.status(500).end();
  }
};

export default handler;
