import { IWallet, Transaction, keepRelevant } from '@meshsdk/core'
import formatTokenAmount from './formatTokenAmount'
import txConfirmation from './txConfirmation'
import { DECIMALS } from '@/constants'

type Recipient = {
  address: string
  tokenId: string
  amount: number
  transactionId?: string
}

const buildTxs = async (
  wallet: IWallet,
  recipients: Recipient[],
  callback: (msg: string, currentBatch: number, totalBatches: number) => void,
  difference?: number
): Promise<Recipient[]> => {
  console.log('Batching TXs')

  const unpayedWallets = recipients.filter(({ transactionId }) => !transactionId)
  const batchSize = difference ? Math.floor(difference * unpayedWallets.length) : unpayedWallets.length
  const batches: Recipient[][] = []

  for (let i = 0; i < unpayedWallets.length; i += batchSize) {
    batches.push(unpayedWallets.slice(i, (i / batchSize + 1) * batchSize))
  }

  try {
    for await (const [idx, batch] of batches.entries()) {
      const tx = new Transaction({ initiator: wallet })

      const inputs = keepRelevant(new Map(batch.map(({ tokenId, amount }) => [tokenId as string, amount.toString()])), await wallet.getUtxos())
      tx.setTxInputs(inputs)

      for (const { address, tokenId, amount } of batch) {
        if (tokenId === 'lovelace') {
          const adaAmount = formatTokenAmount.fromChain(amount, DECIMALS['ADA'])
          if (adaAmount < 1) {
            const str1 = 'Cardano requires at least 1 ADA per TX.'
            const str2 = `This wallet has only ${adaAmount.toFixed(2)} ADA assigned to it:\n${address}`
            const str3 = 'Click OK if you want to increase the payout for this wallet to 1 ADA.'
            const str4 = 'Click cancel to exclude this wallet from the TX.'
            const str5 = 'Note: accepting will increase the total payout amount.'

            if (window.confirm(`${str1}\n\n${str2}\n\n${str3}\n${str4}\n\n${str5}`)) {
              tx.sendLovelace({ address }, formatTokenAmount.toChain(1, DECIMALS['ADA']).toString())
            }
          } else {
            tx.sendLovelace({ address }, amount.toString())
          }
        } else {
          tx.sendAssets({ address }, [
            {
              unit: tokenId,
              quantity: amount.toString(),
            },
          ])
        }
      }

      // this may throw an error if TX size is over the limit
      const unsignedTx = await tx.build()
      console.log(`Building TX ${idx + 1} of ${batches.length}`)
      callback('Building TX', idx + 1, batches.length)

      console.log('Awaiting signature...', unsignedTx)
      const signedTx = await wallet.signTx(unsignedTx)

      console.log('Submitting TX...', signedTx)
      const txHash = await wallet.submitTx(signedTx)

      console.log('Awaiting network confirmation...', txHash)
      callback('Awaiting Network Confirmation', idx + 1, batches.length)
      await txConfirmation(txHash)
      console.log('Confirmed!', txHash)

      recipients = recipients.map((payItem) =>
        batch.some(
          (batchItem) => batchItem.address === payItem.address && batchItem.tokenId === payItem.tokenId && batchItem.amount === payItem.amount
        )
          ? {
              ...payItem,
              transactionId: txHash,
            }
          : payItem
      )
    }

    return recipients
  } catch (error: any) {
    console.error(error)
    const errMsg = error?.response?.data || error?.message || error?.toString() || 'UNKNOWN ERROR'

    if (!!errMsg && errMsg.indexOf('Maximum transaction size') !== -1) {
      // OLD: [Transaction] An error occurred during build: Maximum transaction size of 16384 exceeded. Found: 21861.
      // NEW: txBuildResult error: JsValue("Maximum transaction size of 16384 exceeded. Found: 19226")
      const splitMessage: string[] = errMsg.split(' ')
      const [max, curr] = splitMessage.map((str) => Number(str.replace(/[^\d]/g, ''))).filter((num) => num && !isNaN(num))
      // [16384, any_number_higher_than_16384]

      const newDifference = (difference || 1) * (max / curr)

      const m = `Trying batch size: ${newDifference}`
      console.log(m)
      callback(m, 0, 0)

      return await buildTxs(wallet, recipients, callback, newDifference)
    }

    throw new Error(errMsg)
  }
}

export default buildTxs
