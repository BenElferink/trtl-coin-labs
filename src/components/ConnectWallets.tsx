import { Dispatch, Fragment, SetStateAction, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet as useCardanoWallet } from '@meshsdk/react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton as SolanaWalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ArrowsRightLeftIcon, ArrowsUpDownIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import Loader from '@/components/Loader'
import WalletUrl from './WalletUrl'
import Button, { RedButton } from '@/components/Button'
import CardanoWalletModal from '@/components/CardanoWalletModal'
import type { SubmittedWalletPayload } from '@/@types'

const ConnectWallets = (props: {
  ready: boolean
  done: boolean
  setDone: Dispatch<SetStateAction<boolean>>
  submitted: SubmittedWalletPayload
  setSubmitted: Dispatch<SetStateAction<SubmittedWalletPayload>>
}) => {
  const { ready, done, setDone, submitted, setSubmitted } = props

  const cardano = useCardanoWallet()
  const solana = useSolanaWallet()

  const [openCardanoModal, setOpenCardanoModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const saveWallets = async () => {
    setLoading(true)

    let cAddy = submitted.cardano || ''

    if (!cAddy && cardano.connected) {
      const cUsedAddresses = await cardano.wallet.getUsedAddresses()

      if (cUsedAddresses.length) {
        cAddy = cUsedAddresses[0]
      } else {
        cAddy = await cardano.wallet.getChangeAddress()
      }

      if (cardano.name) localStorage.setItem('cardano_wallet', cardano.name)
    }

    let sAddy = submitted.solana || ''

    if (!sAddy && solana.connected) {
      sAddy = solana.publicKey?.toBase58() || ''

      if (!sAddy) {
        sAddy = solana.wallet?.adapter.publicKey?.toBase58() || ''
      }
    }

    const payload = {
      cardano: cAddy,
      solana: sAddy,
    }

    const hasAllWallets = !!payload.cardano && !!payload.solana
    const toastId = hasAllWallets ? toast.loading('Linking wallets...', { duration: 1000 * 300 }) : ''

    try {
      const { data } = await axios.post('/api/wallets', payload)
      const item = data.items[0]

      setSubmitted(item)

      if (hasAllWallets) {
        toast.dismiss(toastId)
        toast.success('Successfully linked wallets', { duration: 1000 * 5 })

        setDone(true)
      } else if (!!item.cardano && !!item.solana) {
        setDone(true)
      }
    } catch (error: any) {
      console.error(error?.message || error)

      toast.dismiss(toastId)
      toast.error('Failed to link wallets', { duration: 1000 * 5 })
    } finally {
      setLoading(false)
    }
  }

  const unlinkWallets = async () => {
    setLoading(true)
    const toastId = toast.loading('Unlinking wallets...', { duration: 1000 * 300 })

    try {
      cardano.disconnect()
      await solana.disconnect()

      toast.dismiss(toastId)
      toast.success('Successfully unlinked wallets', { duration: 1000 * 5 })

      setSubmitted({ id: '', cardano: '', solana: '' })
      setDone(false)
    } catch (error: any) {
      console.error(error?.message || error)

      toast.dismiss(toastId)
      toast.error('Failed to unlink wallets', { duration: 1000 * 5 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready && !done) saveWallets()

    if (!cardano.connected) {
      const walletName = localStorage.getItem('cardano_wallet')
      if (walletName) cardano.connect(walletName)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, done, cardano.connected, solana.connected])

  if (done) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <CheckBadgeIcon className='w-24 h-24 text-green-400' />
        <span>Successfully Linked!</span>

        <p className='mt-2 text-sm text-center'>
          <u className='mr-2'>Cardano:</u>
          <WalletUrl type='cardano' address={submitted.cardano} />
          <br />
          <u className='mr-2'>Solana:</u>
          <WalletUrl type='solana' address={submitted.solana} />
        </p>

        <div className='my-4'>
          <RedButton label='Unlink Wallets' onClick={unlinkWallets} />
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col'>
      <div className='flex flex-col sm:flex-row items-center justify-center'>
        <div>
          {!ready || cardano.connecting ? (
            <Loader />
          ) : cardano.connected || !!submitted.cardano ? (
            <div className='flex flex-col items-center justify-center'>
              <CheckBadgeIcon className='w-24 h-24 text-green-400' />
              <span>Cardano</span>
              <WalletUrl type='cardano' address={submitted.cardano} />
            </div>
          ) : (
            <Fragment>
              <Button label='Cardano' disabled={loading} onClick={() => setOpenCardanoModal(true)} />
              <CardanoWalletModal isOpen={openCardanoModal} onClose={() => setOpenCardanoModal(false)} />
            </Fragment>
          )}
        </div>

        <div className='m-2'>
          <ArrowsRightLeftIcon className='w-12 h-12 hidden sm:block' />
          <ArrowsUpDownIcon className='w-12 h-12 block sm:hidden' />
        </div>

        <div>
          {!ready || solana.connecting ? (
            <Loader />
          ) : solana.connected || !!submitted.solana ? (
            <div className='flex flex-col items-center justify-center'>
              <CheckBadgeIcon className='w-24 h-24 text-green-400' />
              <span>Solana</span>
              <WalletUrl type='solana' address={submitted.solana} />
            </div>
          ) : (
            <Button disabled={loading}>
              <div className='relative'>
                <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0'>Solana</span>
                <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42%] z-10 flex items-center justify-center'>
                  <SolanaWalletMultiButton disabled={loading} style={{ width: '165px', height: '75px', opacity: 0 }} />
                </div>
              </div>
            </Button>
          )}
        </div>
      </div>

      {ready && (cardano.connected || solana.connected) ? (
        <div className='w-full mt-4 flex items-center justify-center sm:hidden'>
          <Button
            label='Copy Link'
            onClick={() => {
              navigator.clipboard.writeText(`https://trtl-labs.vercel.app/?id=${submitted.id}`)

              toast.success('Successfully Copied', { duration: 10000 })
              toast.loading('Now paste the link in your other wallet', { duration: 10000 })
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export default ConnectWallets
