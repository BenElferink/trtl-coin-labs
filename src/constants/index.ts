export const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || ''
export const TAPTOOLS_API_KEY = process.env.TAPTOOLS_API_KEY || ''
export const KOIOS_API_KEY = process.env.NEXT_PUBLIC_KOIOS_API_KEY || ''

export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || ''
export const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID || ''
export const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || ''
export const FIREBASE_MESSAGING_SENDER_ID = process.env.FIREBASE_MESSAGING_SENDER_ID || ''
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || ''
export const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || ''

export const SOL_NET = 'mainnet-beta'

export const DECIMALS = {
  ADA: 6,
}

export const TRTL_COIN = {
  CARDANO: {
    POLICY_ID: '52162581184a457fad70470161179c5766f00237d4b67e0f1df1b4e6',
    TOKEN_NAME: '5452544c',
    TOKEN_ID: '52162581184a457fad70470161179c5766f00237d4b67e0f1df1b4e65452544c',
    DECIMALS: 0,
    CIRCULATING: 168000000000,
  },
  SOLANA: {
    TOKEN_ID: '9TMuCmQqMBaW8JRPGJEAuetJt94JVruuKVY8r8HvtYKd',
    DECIMALS: 6,
    CIRCULATING: 60000000000,
  },
}

export const TRTL_LP = {
  CARDANO: {
    MINSWAP_V1_POLICY_ID: 'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86',
    MINSWAP_V1_TOKEN_NAME: 'ccd6ccf11c5eab6a9964bc9a080a506342a4bb037209e100f0be238da7495a9c',
    MINSWAP_V1_TOKEN_ID: 'e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86ccd6ccf11c5eab6a9964bc9a080a506342a4bb037209e100f0be238da7495a9c',

    MINSWAP_V2_POLICY_ID: 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c',
    MINSWAP_V2_TOKEN_NAME: '98cd1a0de51bf17c8ae857f72f215c75a447e4d04fa35cb58364e85e476012c3',
    MINSWAP_V2_TOKEN_ID: 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c98cd1a0de51bf17c8ae857f72f215c75a447e4d04fa35cb58364e85e476012c3',
  },
  SOLANA: {},
}

export const TURTLE_NFT = {
  CARDANO: {
    POLICY_ID: '4c1e0a4bcdd31f9e0dcdb62c8e7ce2dc69265078f41663ed8ab66816',
    POLICY_ID_DEPRECATED: '263eb3e3c980c15305f393dc7a2f6289ba12732b6636efe46d6e2c16',
  },
  SOLANA: {},
}

export const SIDEKICK_NFT = {
  CARDANO: {
    POLICY_ID: 'df1a927fcf6c17d7faafdac0f8728fb2a20b509b82fd1d2b614d3ae3',
  },
  SOLANA: {},
}

export const ADA_DEV_1_ADDRESS = 'addr1qxyxg6mcpmsk60stzy8sadp0f6z2npm280rmvvw9x7536d77nsavexls6g59x007aucn2etqp2q4rd0929z2ukcn78fs62p2yg' // $benelferink
export const ADA_DEV_2_ADDRESS = 'addr1q87zdn98e39kwqev8rkk545zxlxqtwnnuvwnw5vcllsw0atvg5rgp8086x0tndsejz8zqf68r6tla9fmxg62ga39s4sq3660m2' // $itzdanny
export const ADA_TURTLE_TEAM_ADDRESS = 'addr1qx77evuery6s5taffnmg72caf0srne8p4lwemv7c45wag39xtcpgwp9h4hnhe4u8rd673uet6qdjvzynpaq8x99nerdqr2sajs'
export const ADA_SIDEKICK_TEAM_ADDRESS = 'addr1qytnuz7zwnwzudug4lxr9z3x4vw4c8qke66pansyeljm6zn78a6e49hfunhx5thtfpzey2c9mqjrc3r72r3yjal57fwsryq0dl'

export const ADA_TURTLE_APP_ADDRESS = 'addr1v9ttkfs54sscs5fl4amhpsxu3dk852654hfskg4qjsu5mgcxu36dr'
export const ADA_TURTLE_COLLATERAL_ADDRESS = 'addr1q9ttkfs54sscs5fl4amhpsxu3dk852654hfskg4qjsu5mgevwsgyffe23k6x8rlm799l3ks67au5732624346eqqdfgs5ngcaf'
export const ADA_TURTLE_APP_SECRET_KEY = Array.isArray(process.env.ADA_TURTLE_APP_SECRET_KEY)
  ? process.env.ADA_TURTLE_APP_SECRET_KEY
  : process.env.ADA_TURTLE_APP_SECRET_KEY?.split(',') || []

export const ADA_SIDEKICK_APP_ADDRESS = 'addr1qxs2lnqh4arkw38ater7f0uxhsmklutzlxwwkat0zcxjqfr9akx968jx94jwuz2a3sw0jvjm4r3lvsh8uply2y3q546sk5jfm0'
export const ADA_SIDEKICK_APP_SECRET_KEY = Array.isArray(process.env.ADA_SIDEKICK_APP_SECRET_KEY)
  ? process.env.ADA_SIDEKICK_APP_SECRET_KEY
  : process.env.ADA_SIDEKICK_APP_SECRET_KEY?.split(',') || []

export const ADA_BRIDGE_APP_ADDRESS = 'addr1vx59g85l5wvweap5l76nnt9r429jt3yszm7x5n65aq87q5c0s8szy'
export const ADA_BRIDGE_APP_SECRET_KEY = Array.isArray(process.env.ADA_BRIDGE_APP_SECRET_KEY)
  ? process.env.ADA_BRIDGE_APP_SECRET_KEY
  : process.env.ADA_BRIDGE_APP_SECRET_KEY?.split(',') || []

export const SOL_BRIDGE_APP_ADDRESS = 'ChCJv4P16YDBCVaM8eoLTaP7MMLE7ooMD5YbynBVtakZ'
export const SOL_BRIDGE_APP_SECRET_KEY = (
  Array.isArray(process.env.SOL_BRIDGE_APP_SECRET_KEY)
    ? process.env.SOL_BRIDGE_APP_SECRET_KEY
    : process.env.SOL_BRIDGE_APP_SECRET_KEY?.split(',') || []
).map((n) => Number(n))
