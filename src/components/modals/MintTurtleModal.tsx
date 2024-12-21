import { Fragment, useEffect, useState } from 'react'
import axios from 'axios'
import { useWallet } from '@meshsdk/react'
import { AssetExtended } from '@meshsdk/core'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import { firestore } from '@/utils/firebase'
import buildTxs from '@/functions/buildTxs'
import formatTokenAmount from '@/functions/formatTokenAmount'
import Modal from '../Modal'
import Loader from '../Loader'
import Button from '../Button'
import ProgressBar from '../ProgressBar'
import { ADA_DEV_1_ADDRESS, ADA_TURTLE_APP_ADDRESS, ADA_TURTLE_COLLATERAL_ADDRESS, ADA_TURTLE_TEAM_ADDRESS, DECIMALS, TURTLE_NFT } from '@/constants'
import type { FetchedTimestampResponse } from '@/pages/api/timestamp'
import type { DBMintTurtlePayload } from '@/@types'

const MintTurtleModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { wallet, connected } = useWallet()
  const [oldNfts, setOldNfts] = useState<AssetExtended[]>([])
  const [error, setError] = useState('')
  const [progress, setProgress] = useState({
    msg: '',
    loading: false,
    done: false,
    batch: {
      current: 0,
      max: 0,
    },
  })

  const getAndSetOldCount = async () => {
    if (wallet) {
      const assets = await wallet.getPolicyIdAssets(TURTLE_NFT['CARDANO']['POLICY_ID_DEPRECATED'])
      setOldNfts(assets)
    } else {
      setOldNfts([])
    }
  }

  useEffect(() => {
    getAndSetOldCount()
  }, [wallet])

  const handleTradeIn = async () => {
    if (!connected) return setError('Wallet not connected. Please connect your wallet.')
    if (!oldNfts.length) return setError('User has insufficient tokens for this action')

    const {
      data: { now },
    } = await axios.get<FetchedTimestampResponse>('/api/timestamp')

    const address = (await wallet.getUsedAddresses())[0] || (await wallet.getChangeAddress())

    const dbPayload: DBMintTurtlePayload = {
      timestamp: now,
      didBurn: false,
      didMint: false,
      address,
      amount: oldNfts.length,
    }

    if (!dbPayload.address) return setError('Wallet does not have a change address')

    const collection = firestore.collection('turtle-syndicate-swaps')
    const { id: docId } = await collection.add(dbPayload)

    try {
      setProgress((prev) => ({ ...prev, loading: true, msg: 'Batching TXs...' }))

      await buildTxs(
        wallet,
        [
          {
            address: ADA_DEV_1_ADDRESS,
            tokenId: 'lovelace',
            amount: formatTokenAmount.toChain(Math.max(oldNfts.length * 1, 1), DECIMALS['ADA']),
          },
          {
            address: ADA_TURTLE_APP_ADDRESS,
            tokenId: 'lovelace',
            amount: formatTokenAmount.toChain(oldNfts.length * 2, DECIMALS['ADA']),
          },
          {
            address: ADA_TURTLE_COLLATERAL_ADDRESS,
            tokenId: 'lovelace',
            amount: formatTokenAmount.toChain(oldNfts.length * 2, DECIMALS['ADA']),
          },
          ...oldNfts.map((t) => ({
            address: ADA_TURTLE_TEAM_ADDRESS,
            tokenId: t.unit,
            amount: Number(t.quantity),
          })),
        ],
        (msg, currentBatch, totalBatches) => {
          setProgress((prev) => ({
            ...prev,
            msg,
            batch: { current: currentBatch, max: totalBatches },
          }))
        }
      )

      await collection.doc(docId).update({ didBurn: true })

      setProgress((prev) => ({ ...prev, msg: 'Your Turtles will be minted soon 😍', loading: false, done: true }))

      await axios.post('/api/mint', { docId })
    } catch (error: any) {
      const errMsg = error?.message || error?.toString() || ''

      setProgress((prev) => ({
        ...prev,
        msg: errMsg,
        loading: false,
        done: false,
        batch: { current: 0, max: 0 },
      }))
    }

    await getAndSetOldCount()
  }

  return (
    <Modal open={isOpen} onClose={() => onClose()}>
      <div className='flex flex-col items-center'>
        <h6 className='text-lg mb-12'>Trade-in your old Turtles for brand new &amp; upgraded Turtles!</h6>

        {!progress.done && !progress.loading ? (
          <Fragment>
            <p>
              You have {oldNfts.length} NFTs to trade-in {oldNfts.length ? '🥳' : '😔'}
            </p>

            <div className='my-4'>
              <Button label='Trade In' disabled={!oldNfts.length || progress.loading || progress.done} onClick={handleTradeIn} />
            </div>
          </Fragment>
        ) : progress.done ? (
          <CheckBadgeIcon className='w-24 h-24 text-green-400' />
        ) : !progress.done && progress.batch.max ? (
          <ProgressBar label='TX Batches' max={progress.batch.max} current={progress.batch.current} />
        ) : null}

        {progress.loading ? <Loader withLabel label={progress.msg} /> : <span>{progress.msg}</span>}

        {error && <p className='text-red-500 text-center'>{error}</p>}
      </div>
    </Modal>
  )
}

export default MintTurtleModal
