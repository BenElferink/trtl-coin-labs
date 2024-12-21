import type { NextApiRequest, NextApiResponse } from 'next'
import { BlockfrostProvider, ForgeScript, MeshWallet, Mint, Transaction } from '@meshsdk/core'
import { firebase, firestore } from '@/utils/firebase'
import blockfrost from '@/utils/blockfrost'
import formatHex from '@/functions/formatHex'
import formatTokenAmount from '@/functions/formatTokenAmount'
import type { DBMintSidekickPayload } from '@/@types'
import {
  BLOCKFROST_API_KEY,
  ADA_SIDEKICK_APP_SECRET_KEY,
  SIDEKICK_NFT,
  ADA_SIDEKICK_TEAM_ADDRESS,
  ADA_DEV_1_ADDRESS,
  ADA_DEV_2_ADDRESS,
  ADA_SIDEKICK_APP_ADDRESS,
  TRTL_LP,
} from '@/constants'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

type InputIutput = {
  [address: string]: {
    [unit: string]: number
  }
}

export const getTxInfo = async (txHash: string) => {
  const allowedUnits = ['lovelace', TRTL_LP['CARDANO']['MINSWAP_V1_TOKEN_ID'], TRTL_LP['CARDANO']['MINSWAP_V2_TOKEN_ID']]
  const allowedTargets = [ADA_SIDEKICK_TEAM_ADDRESS, ADA_DEV_1_ADDRESS, ADA_DEV_2_ADDRESS, ADA_SIDEKICK_APP_ADDRESS]

  const { inputs, outputs } = await blockfrost.txsUtxos(txHash)

  const sent: InputIutput = {}
  const received: InputIutput = {}

  inputs.forEach((inp) => {
    const from = inp.address
    if (!sent[from]) sent[from] = {}

    inp.amount.forEach(({ unit, quantity }) => {
      if (allowedUnits.includes(unit) || !allowedUnits.length) {
        const num = Number(quantity)

        if (!sent[from][unit]) {
          sent[from][unit] = num
        } else {
          sent[from][unit] += num
        }
      }
    })
  })

  const sentEntries = Object.entries(sent)

  if (!sentEntries.length) throw new Error('?? no inputs')

  outputs.forEach((outp) => {
    const to = outp.address

    if (allowedTargets.includes(to) || !allowedTargets.length) {
      if (!received[to]) received[to] = {}

      outp.amount.forEach(({ unit, quantity }) => {
        if (allowedUnits.includes(unit) || !allowedUnits.length) {
          const num = Number(quantity)

          if (!received[to][unit]) {
            received[to][unit] = num
          } else {
            received[to][unit] += num
          }
        }
      })
    }
  })

  const sentFrom = sentEntries.find((x) => {
    const sent = Object.entries(x[1])
    const found = sent.find(([unit]) => [allowedUnits[1], allowedUnits[2]].includes(unit))

    return !!found
  })?.[0]

  if (!sentFrom) throw new Error('?? no sender')

  let sentLp = false
  let mintAmount = 0

  allowedTargets.forEach((addr) => {
    Object.entries(received[addr] || {}).forEach(([unit, num]) => {
      if (unit === allowedUnits[0]) {
        mintAmount += num
      }

      if (unit === allowedUnits[1] || unit === allowedUnits[2]) {
        sentLp = true
      }
    })
  })

  mintAmount = formatTokenAmount.fromChain(mintAmount, 6) / 10

  return { mintAmount, sentLp, sentFrom }
}

const getRandomDoc = async (
  collectionQuery: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>,
  previouslyGotDocIds: string[]
): Promise<{ id: string; data: Mint }> => {
  const idx = Math.floor(Math.random() * (collectionQuery.docs.length + 1))
  const doc = collectionQuery.docs[idx]
  const data = doc?.data() as Mint | undefined

  if (!data || !!previouslyGotDocIds.find((id) => id === doc.id)) return await getRandomDoc(collectionQuery, previouslyGotDocIds)

  try {
    const policyId = SIDEKICK_NFT['CARDANO']['POLICY_ID']
    const tokenId = `${policyId}${formatHex.toHex(data.assetName)}`
    const foundToken = await blockfrost.assetsById(tokenId)

    if (!!foundToken && Number(foundToken.quantity) > 0) {
      console.error(`Already minted this token: ${tokenId}`)
      console.error(`Must delete doc with ID: ${doc.id}`)

      return await getRandomDoc(collectionQuery, previouslyGotDocIds)
    }
  } catch (error) {
    // Token not found: THIS IS OK!
  }

  return { id: doc.id, data }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req

  try {
    switch (method) {
      case 'POST': {
        const { txHash: txFromBody } = body

        const swapCollection = firestore.collection('turtle-sidekick-swaps')
        const swapDocs = await swapCollection.where('txHash', '==', txFromBody).get()

        let data: DBMintSidekickPayload | undefined
        let docId = ''

        if (swapDocs.empty) {
          const dbPayload: DBMintSidekickPayload = {
            timestamp: Date.now(),
            txHash: txFromBody,
            didSend: false,
            didMint: false,
          }

          const { id } = await swapCollection.add(dbPayload)
          const doc = await swapCollection.doc(id).get()

          data = doc.data() as DBMintSidekickPayload
          docId = id
        } else {
          data = swapDocs.docs[0].data() as DBMintSidekickPayload
          docId = swapDocs.docs[0].id
        }

        if (!data) throw new Error('?? no data')
        if (!docId) throw new Error('?? no doc id')

        const { didMint, didSend } = data

        if (didMint) return res.status(400).end('Already completed mint for this TX')

        if (!didSend) {
          const { sentFrom, sentLp, mintAmount } = await getTxInfo(txFromBody)

          if (!sentLp) return res.status(400).end('User did not send LP')
          if (!mintAmount) return res.status(400).end('User does not have mint amount')

          await swapCollection.doc(docId).update({
            didSend: true,
            address: sentFrom,
            amountToMint: mintAmount,
          })

          const doc = await swapCollection.doc(docId).get()

          data = doc.data() as DBMintSidekickPayload
        }

        const { address: recipientAddress, amountToMint, amountMinted } = data
        const amountRemaining = (amountToMint || 0) - (amountMinted || 0)

        if (!amountRemaining) return res.status(400).end('User does not have remaining mint amount')

        const assetCollection = firestore.collection('turtle-sidekick-assets')
        const assetDocs = await assetCollection.get()

        const mintItems: Mint[] = []
        const usedDocIds: string[] = []

        for (let i = 0; i < Math.min(amountRemaining, 2); i++) {
          const { id, data } = await getRandomDoc(assetDocs, usedDocIds)

          const payload: Mint = {
            ...data,
            recipient: recipientAddress,
          }

          mintItems.push(payload)
          usedDocIds.push(id)
        }

        console.log(`minting ${mintItems.length}/${amountRemaining} items`)

        const provider = new BlockfrostProvider(BLOCKFROST_API_KEY)
        const wallet = new MeshWallet({
          networkId: 1,
          fetcher: provider,
          submitter: provider,
          key: {
            type: 'mnemonic',
            words: ADA_SIDEKICK_APP_SECRET_KEY,
          },
        })

        const address = wallet.addresses.baseAddressBech32

        if (!address) throw new Error('MeshWallet does not have baseAddressBech32')

        const script = ForgeScript.withOneSignature(address)
        const tx = new Transaction({ initiator: wallet })

        mintItems.forEach((item) => tx.mintAsset(script, item))

        console.log('building TX')
        const unsigTx = await tx.build()
        console.log('submitting TX')
        const sigTx = await wallet.signTx(unsigTx)
        console.log('signing TX')
        const txHash = await wallet.submitTx(sigTx)

        const { FieldValue } = firebase.firestore

        await swapCollection.doc(docId).update({
          didMint: (amountMinted || 0) + mintItems.length === amountToMint,
          amountMinted: FieldValue.increment(mintItems.length),
        })

        if (usedDocIds.length) {
          const batch = firestore.batch()
          usedDocIds.forEach((id) => batch.delete(assetCollection.doc(id)))
          await batch.commit()
        }

        return res.status(200).json({ txHash })
      }

      default: {
        res.setHeader('Allow', 'POST')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end()
  }
}

export default handler
