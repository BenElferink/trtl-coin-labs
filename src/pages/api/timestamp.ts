import type { NextApiRequest, NextApiResponse } from 'next'

export interface FetchedTimestampResponse {
  now: number
}

const handler = async (req: NextApiRequest, res: NextApiResponse<FetchedTimestampResponse>) => {
  const { method, query } = req

  try {
    switch (method) {
      case 'GET': {
        const now = Date.now()

        return res.status(200).json({
          now,
        })
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
      }
    }
  } catch (error: any) {
    console.error(error)
    return res.status(500).end()
  }
}

export default handler
