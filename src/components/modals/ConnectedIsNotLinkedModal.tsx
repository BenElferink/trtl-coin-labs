import Modal from '../Modal'
import WalletUrl from '../WalletUrl'
import { RedButton } from '../Button'
import type { SubmittedWalletPayload } from '@/@types'

const ConnectedIsNotLinkedModal = ({
  open,
  onClose,
  onDisconnect,
  type,
  submitted,
  connectedAddress,
}: {
  open: boolean
  onClose: () => void
  onDisconnect: () => void
  type: 'cardano' | 'solana'
  submitted: SubmittedWalletPayload
  connectedAddress: string
}) => {
  return (
    <Modal open={open} onClose={() => onClose()}>
      <div className='flex flex-col items-center text-center'>
        <p className='my-2 text-lg'>
          Connected Wallet does not match Linked Wallet,
          <br />
          please connect a different wallet.
        </p>

        <p className='my-2 text-sm'>
          Connected with: <WalletUrl type={type} address={submitted[type]} />
          <br />
          Linked with: <WalletUrl type={type} address={connectedAddress} />
        </p>

        <RedButton label='Disconnect' onClick={onDisconnect} />
      </div>
    </Modal>
  )
}

export default ConnectedIsNotLinkedModal
