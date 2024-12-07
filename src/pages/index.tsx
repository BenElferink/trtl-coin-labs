'use client';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { firestore } from '@/utils/firebase';
import Button from '@/components/Button';
import ConnectWallets from '@/components/ConnectWallets';
import BridgeToSolanaModal from '@/components/modals/BridgeToSolanaModal';
import MintSidekickModal from '@/components/modals/MintSidekickModal';
import type { DBWalletPayload } from '@/@types';

export const getServerSideProps: GetServerSideProps<DBWalletPayload & { docId: string }> = async ({ query }) => {
  const id = (query.id || '') as string;

  if (!!id) {
    const collection = firestore.collection('linked-wallets');
    const doc = await collection.doc(id).get();

    if (doc.exists) {
      return { props: { ...(doc.data() as DBWalletPayload), docId: id } };
    }
  }

  return { props: { docId: id, cardano: '', solana: '' } };
};

export type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const Page = ({ docId, cardano: cardanoAddress, solana: solanaAddress }: PageProps) => {
  const [submitted, setSubmitted] = useState({ id: docId, cardano: cardanoAddress, solana: solanaAddress });
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(!!cardanoAddress && !!solanaAddress);

  useEffect(() => setReady(true), []);

  const [openModals, setOpenModals] = useState({
    solanaBridge: false,
    cardanoBridge: false,
    mintSidekick: false,
  });

  const toggleModal = (name: keyof typeof openModals) => setOpenModals((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-between'>
      <header className='p-4 text-center'>
        <h1 className='text-3xl'>Tortol Token</h1>
        <p>Connect your wallets and go cross-chain!</p>
      </header>

      <main>
        <ConnectWallets ready={ready} done={done} setDone={setDone} submitted={submitted} setSubmitted={setSubmitted} />

        {done ? (
          <div>
            <div className='my-2 flex'>
              <Button
                label='Mint Turtle'
                colors='bg-green-500 border-green-400 [box-shadow:0_10px_0_0_#276749,0_15px_0_0_#27674941] active:[box-shadow:0_0px_0_0_#276749,0_0px_0_0_#27674941]'
                onClick={() => window.open('https://trtl-nft-swap.vercel.app', '_blank', 'noopener noreferrer')}
              />
              <Button
                label='Mint Sidekick'
                colors='bg-green-500 border-green-400 [box-shadow:0_10px_0_0_#276749,0_15px_0_0_#27674941] active:[box-shadow:0_0px_0_0_#276749,0_0px_0_0_#27674941]'
                onClick={() => toggleModal('mintSidekick')}
              />
            </div>
            <div className='my-2 flex'>
              <Button label='Bridge to Solana' onClick={() => toggleModal('solanaBridge')} />
              <Button label='Bridge to Cardano' disabled onClick={() => toggleModal('cardanoBridge')} />
            </div>

            {openModals['solanaBridge'] ? (
              <BridgeToSolanaModal isOpen={openModals['solanaBridge']} onClose={() => toggleModal('solanaBridge')} />
            ) : null}
            {openModals['mintSidekick'] ? (
              <MintSidekickModal isOpen={openModals['mintSidekick']} onClose={() => toggleModal('mintSidekick')} />
            ) : null}
          </div>
        ) : null}
      </main>

      <footer className='p-4 text-center'>
        <h5 className='mb-4 text-xs'>Contributions from:</h5>

        <div className='flex items-center justify-center'>
          <Link
            href='https://x.com/intent/follow?screen_name=BenElferink'
            target='_blank'
            rel='noopener noreferrer'
            className='m-2 mx-4 flex flex-col items-center justify-center'
          >
            <Image src='https://avatars.githubusercontent.com/u/69640911' alt='benelferink' width={50} height={50} className='rounded-full' />
            <h6 className='mt-2 text-sm text-start whitespace-nowrap'>$benelferink</h6>
          </Link>

          <Link
            href='https://x.com/intent/follow?screen_name=itzdannyADA'
            target='_blank'
            rel='noopener noreferrer'
            className='m-2 mx-4 flex flex-col items-center justify-center'
          >
            <Image src='/media/itzdanny.jpeg' alt='itzdanny' width={50} height={50} className='rounded-full' />
            <h6 className='mt-2 text-sm text-start whitespace-nowrap'>$itzdanny</h6>
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Page;
