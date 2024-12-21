import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Transaction } from '@meshsdk/core'
import { useWallet } from '@meshsdk/react'
import {
  fetchAssetPrice,
  calculateRequiredADALPTokensV1,
  calculateRequiredADALPTokensV2,
  calculateRequiredSOLLPTokens,
  fetchTotalADALPTokens,
  fetchTrtlPoolData,
} from '@/functions/dynamicPricingLP'
import { formatNumber } from '@/functions/formatNumber'
import formatTokenAmount from '@/functions/formatTokenAmount'
import txConfirmation from '@/functions/txConfirmation'
import Modal from '../Modal'
import Loader from '../Loader'
import ImageCarousel from '../ImageCarousel'
import { ADA_SIDEKICK_TEAM_ADDRESS, TRTL_LP, ADA_SIDEKICK_APP_ADDRESS, ADA_DEV_1_ADDRESS, ADA_DEV_2_ADDRESS } from '@/constants'

interface MintModalProps {
  isOpen: boolean
  onClose: () => void
}

const MintSidekickModal = ({ isOpen, onClose }: MintModalProps) => {
  const { wallet, connected } = useWallet()

  const [lpTokensNeededV1, setLPTokensNeededV1] = useState<number>(0)
  const [lpTokensNeededV2, setLPTokensNeededV2] = useState<number>(0)
  const [lpTokensSolNeeded, setLPTokensSolNeeded] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      const [adaprice, adaTvlV1, adaTvlV2, totalLpTokens] = await Promise.all([
        fetchAssetPrice('cardano'),
        fetchTrtlPoolData('v1'),
        fetchTrtlPoolData('v2'),
        fetchTotalADALPTokens(),
      ])

      const { v1: adaLpTokensV1, v2: adaLpTokensV2 } = totalLpTokens || {}

      if (adaprice && adaTvlV1 && adaTvlV2 && adaLpTokensV1 && adaLpTokensV2) {
        setLPTokensNeededV1(Math.ceil(calculateRequiredADALPTokensV1(adaprice, adaTvlV1, adaLpTokensV1)))
        setLPTokensNeededV2(Math.ceil(calculateRequiredADALPTokensV2(adaprice, adaTvlV2, adaLpTokensV2)))
        setLPTokensSolNeeded(Math.ceil(await calculateRequiredSOLLPTokens()))
      }
    })()
  }, [])

  const [isSolSelected, setIsSolSelected] = useState(true)
  const [isAdaV1Selected, setIsAdaV1Selected] = useState(true)
  const [mintAmount, setMintAmount] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const lpTokensNeeded = useMemo(
    () =>
      isSolSelected
        ? lpTokensSolNeeded // SOL LP is selected
        : isAdaV1Selected
        ? lpTokensNeededV1 // ADA V1 LP is selected
        : lpTokensNeededV2, // ADA V2 LP is selected
    [isSolSelected, isAdaV1Selected, lpTokensSolNeeded, lpTokensNeededV1, lpTokensNeededV2]
  )

  const buildTx = async () => {
    if (!connected) return setError('Wallet not connected. Please connect your wallet.')
    if (isSolSelected) return setError('For Solana, please create a ticket in Discord.')

    setLoading(true)
    setError('')

    try {
      const adaDecimals = 6
      const lpTokenId = isAdaV1Selected ? TRTL_LP['CARDANO']['MINSWAP_V1_TOKEN_ID'] : TRTL_LP['CARDANO']['MINSWAP_V2_TOKEN_ID']

      const tx = new Transaction({ initiator: wallet })
        // team
        .sendAssets({ address: ADA_SIDEKICK_TEAM_ADDRESS }, [
          {
            unit: 'lovelace',
            quantity: String(formatTokenAmount.toChain(mintAmount * 4, adaDecimals)),
          },
          {
            unit: lpTokenId,
            quantity: String(mintAmount * lpTokensNeeded),
          },
        ])
        // developers
        .sendLovelace({ address: ADA_DEV_1_ADDRESS }, String(formatTokenAmount.toChain(mintAmount * 2, adaDecimals)))
        .sendLovelace({ address: ADA_DEV_2_ADDRESS }, String(formatTokenAmount.toChain(mintAmount * 2, adaDecimals)))
        // mint app
        .sendLovelace({ address: ADA_SIDEKICK_APP_ADDRESS }, String(formatTokenAmount.toChain(mintAmount * 2, adaDecimals)))

      toast.loading('Building TX')
      const unsignedTx = await tx.build()

      toast.dismiss()
      toast.loading('Awaiting TX signature')
      const signedTx = await wallet?.signTx(unsignedTx)

      toast.dismiss()
      toast.loading('Submitting TX')
      const txHash = await wallet?.submitTx(signedTx as string)

      toast.dismiss()
      toast.loading('Awaiting confirmation')
      await txConfirmation(txHash as string)
      toast.dismiss()
      toast.success('TX submitted!')

      try {
        toast.loading('Minting NFT...')
        await axios.post('/api/sidekick/mint', { txHash })
        toast.dismiss()
        toast.success('NFT minted!')
      } catch (error) {
        toast.dismiss()
        toast.success('NFT will be minted soon!')
      }

      onClose() // Close modal after minting
    } catch (e: any) {
      console.error(e)
      const msg = (e?.message || e?.info || e?.toString() || 'Minting failed. Please contact us.').trim()

      toast.dismiss()
      toast.error(`ERROR: ${msg}`)

      if (msg === 'txBuildResult error:') {
        // No context in error = insufficient funds
        // See issue: https://github.com/MeshJS/mesh/issues/307
        setError('txBuildResult error: Insufficient funds')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value)

    if (num >= 0) {
      setMintAmount(num)
      setError('')
    } else {
      setMintAmount(0)
      setError('Mint amount cannot be negative.')
    }
  }

  const toggleLPType = () => setIsSolSelected(!isSolSelected)
  const toggleAdaVersion = () => setIsAdaV1Selected(!isAdaV1Selected)
  const incrementAmount = () => setMintAmount((prev) => (prev !== null ? prev + 1 : 1))
  const decrementAmount = () => setMintAmount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0))

  return (
    <Modal open={isOpen} onClose={() => onClose()}>
      <div className='flex flex-col items-center'>
        <ImageCarousel
          images={[
            '/media/sidekickSneakPeek/sidekick3.png', // garry snail
            '/media/sidekickSneakPeek/sidekick4.jpg', // robin snail
            '/media/sidekickSneakPeek/sidekick5.jpg', // spidey snail
            '/media/sidekickSneakPeek/sidekick1.jpg',
            '/media/sidekickSneakPeek/sidekick2.jpg',
          ]}
        />

        <div className='mb-4 mt-2 flex items-center justify-center'>
          <span className='mr-2 px-4 py-2 text-white'>TRTL/ADA LP</span>
          <div onClick={toggleLPType} className='relative inline-block w-12 h-6 cursor-pointer bg-gray-500 rounded-full'>
            <span
              className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${isSolSelected ? 'translate-x-6' : ''}`}
            />
          </div>
          <span className='ml-2 px-4 py-2 text-white'>TRTL/SOL LP</span>
        </div>

        {!isSolSelected && (
          <div className='mb-4 flex items-center justify-center'>
            <span className='mr-2 px-4 text-white'>V1 Pool</span>
            <div onClick={toggleAdaVersion} className='relative inline-block w-12 h-6 cursor-pointer bg-gray-500 rounded-full'>
              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transform ${!isAdaV1Selected ? 'translate-x-6' : ''}`} />
            </div>
            <span className='ml-2 px-4 text-white'>V2 Pool</span>
          </div>
        )}

        <p className='text-white text-center'>
          {formatNumber(mintAmount * lpTokensNeeded)} {isSolSelected ? 'SOL' : 'ADA'} LP Tokens required
        </p>

        <div className='flex items-center justify-center mt-4 mb-4'>
          <button onClick={decrementAmount} className='bg-gray-300 hover:bg-red-500 text-black px-2 rounded-l-md text-md'>
            -
          </button>
          <input
            readOnly
            type='number'
            placeholder='0'
            value={mintAmount || ''}
            onChange={handleInputChange}
            className='border p-2 w-24 text-center text-white bg-neutral-800 rounded-md'
          />
          <button onClick={incrementAmount} className='bg-gray-300 hover:bg-green-500 text-black px-2 rounded-r-md'>
            +
          </button>
        </div>

        {error && <p className='text-red-500 text-center'>{error}</p>}

        <div className='relative inline-flex items-center'>
          <button
            onClick={buildTx}
            disabled={!mintAmount || !lpTokensNeeded || loading}
            className='bg-gradient-to-b from-blue-500 via-indigo-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:scale-105 disabled:opacity-50 flex items-center justify-center'
          >
            {loading ? <Loader /> : 'Mint'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default MintSidekickModal
