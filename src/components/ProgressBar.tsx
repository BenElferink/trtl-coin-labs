import { Fragment } from 'react'

const ProgressBar = (props: { max: number; current: number; label?: string; isGreen?: boolean; isRed?: boolean }) => {
  const { max = 100, current = 0, label = '', isGreen = false, isRed = false } = props

  const percent = Math.round((100 / max) * current)
  const isFull = current === max

  const borderColor = isFull || isGreen ? 'border-green-600' : isRed ? 'border-red-600' : 'border-blue-600'
  const bgColor = isFull || isGreen ? 'bg-green-600/50' : isRed ? 'bg-red-600/50' : 'bg-blue-600/50'
  const txtColor = isFull || isGreen ? 'text-green-200' : isRed ? 'text-red-200' : 'text-blue-200'

  return (
    <div className={'w-full h-fit my-2 bg-transparent rounded-full border ' + borderColor}>
      <div className={'py-0.5 px-2 rounded-full ' + bgColor} style={{ width: `${percent}%` }}>
        <span className={'whitespace-nowrap text-xs ' + txtColor}>
          {label ? <Fragment>{label}&nbsp;&nbsp;&nbsp;</Fragment> : ''}
          {percent}%&nbsp;&nbsp;&nbsp;({current}&nbsp;/&nbsp;{max})
        </span>
      </div>
    </div>
  )
}

export default ProgressBar
