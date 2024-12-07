import Head from 'next/head';
import { AppProps } from 'next/app';
import { Fragment } from 'react';
import { Toaster } from 'react-hot-toast';
import { MeshProvider } from '@meshsdk/react';
import SolanaProvider from '@/contexts/SolanaProvider';
import '@/styles/globals.css';

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <Fragment>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <meta name='author' content='Ben Elferink' />
        <meta name='keywords' content='cardano, solana, blockchain, trtl, nft, coin, meme, memecoin, community' />
        <meta name='description' content='' />

        <link rel='icon' type='image/x-icon' href='/favicon.ico' />
        <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
        <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
        <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
        <link rel='manifest' href='/manifest.json' />

        <title>$TRTL | Labs</title>
      </Head>

      <Toaster position='top-right' />

      <main className='w-screen min-h-screen bg-black/30'>
        <MeshProvider>
          <SolanaProvider>
            <Component {...pageProps} />
          </SolanaProvider>
        </MeshProvider>
      </main>
    </Fragment>
  );
};

export default App;
