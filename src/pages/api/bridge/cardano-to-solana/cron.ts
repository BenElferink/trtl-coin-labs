import type { NextApiRequest, NextApiResponse } from 'next'
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Account, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'
import { firestore } from '@/utils/firebase'
import type { DBBridgePayload } from '@/@types'
import { SOL_APP_SECRET_KEY, SOL_NET, SOL_TOKEN_ID } from '@/constants'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  try {
    switch (method) {
      case 'GET': {
        const collection = firestore.collection('trtl-bridge-to-sol')
        const { docs } = await collection.where('done', '==', false).get()

        if (!!docs.length) {
          const connection = new Connection(clusterApiUrl(SOL_NET), 'confirmed')

          const appKeypair = Keypair.fromSecretKey(new Uint8Array(SOL_APP_SECRET_KEY))
          const tokenPublicKey = new PublicKey(SOL_TOKEN_ID)

          const getATA = async (publicKey: PublicKey): Promise<Account> => {
            try {
              const toATA = await getOrCreateAssociatedTokenAccount(connection, appKeypair, tokenPublicKey, new PublicKey(publicKey))

              return toATA
            } catch (error) {
              // @ts-ignore
              console.log(error?.message || error)

              return await getATA(publicKey)
            }
          }

          const sendTo = async (toATA: Account, amount: number): Promise<string> => {
            try {
              const txHash = await transfer(connection, appKeypair, appATA.address, toATA.address, appKeypair.publicKey, amount)

              return txHash
            } catch (error) {
              // @ts-ignore
              console.log(error?.message || error)

              return await sendTo(toATA, amount)
            }
          }

          const appATA = await getATA(appKeypair.publicKey)

          for await (const doc of docs) {
            const { solAddress, solAmount } = doc.data() as DBBridgePayload

            const toATA = await getATA(new PublicKey(solAddress))
            const txHash = await sendTo(toATA, solAmount)

            await collection.doc(doc.id).update({
              solTxHash: txHash,
              done: true,
            })
          }
        }

        return res.status(204).end()
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end()
  }
}

export default handler
