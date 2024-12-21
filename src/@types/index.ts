export interface SubmittedWalletPayload {
  id: any
  cardano: any
  solana: any
}

export interface DBWalletPayload {
  cardano: string
  solana: string
}

export interface DBBridgeToSolanaPayload {
  adaTxHash: string
  adaAddress: string
  adaAmount: number
  solTxHash: string
  solAddress: string
  solAmount: number
  done: boolean
}

export interface DBMintTurtlePayload {
  timestamp: number
  didBurn: boolean
  didMint: boolean
  address: string
  amount: number
  amountMinted?: number
}

export interface DBMintSidekickPayload {
  timestamp: number
  txHash: string
  didSend: boolean
  didMint: boolean
  address?: string
  amountToMint?: number
  amountMinted?: number
}
