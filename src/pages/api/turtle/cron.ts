import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { firestore } from '@/utils/firebase'
import sleep from '@/functions/sleep'
import type { DBMintTurtlePayload } from '@/@types'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  try {
    switch (method) {
      case 'GET': {
        const now = new Date().getTime()

        const collection = firestore.collection('turtle-syndicate-swaps')
        const { docs } = await collection.get()

        const swaps = docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as (DBMintTurtlePayload & { id: string })[]

        const swapsThatNeedToMint = swaps.filter((doc) => !doc.didMint && doc.didBurn && now - doc.timestamp >= 300000) // 5 minutes
        // const swapsThatNeedToDelete = swaps.filter((doc) => !doc.didMint && !doc.didBurn && now - doc.timestamp >= 900000) // 15 minutes

        if (swapsThatNeedToMint.length) {
          console.warn(`found ${swapsThatNeedToMint.length} swaps that need to mint`)

          for await (const { id } of swapsThatNeedToMint) {
            await axios.post('https://trtl-labs.vercel.app/api/turtle/mint', { docId: id })
            await sleep(2000)
          }
        }

        // if (swapsThatNeedToDelete.length) {
        //   const b = firestore.batch()

        //   swapsThatNeedToDelete.forEach(({ id }) => {
        //     b.delete(collection.doc(id))
        //   })

        //   await b.commit()
        // }

        return res.status(204).end()
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)
    return res.status(500).end()
  }
}

export default handler
