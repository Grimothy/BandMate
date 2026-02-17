import * as React from 'react'
import { BaseInput } from './Input'
import { cn } from '@/lib/utils'

interface TimeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
  onChangeSeconds?: (seconds: number) => void
  onCommitSeconds?: (seconds: number) => void
  validate?: boolean
  revertOnInvalid?: boolean
}

function parseToSeconds(input: string): number | null {
  if (!input) return null
  const cleaned = input.trim()

  // mm:ss or m:ss
  const mmss = cleaned.match(/^(\d+):(\d{1,2})$/)
  if (mmss) {
    const minutes = parseInt(mmss[1], 10)
    const seconds = parseInt(mmss[2], 10)
    if (isNaN(minutes) || isNaN(seconds) || seconds < 0) return null
    return minutes * 60 + seconds
  }

  // pure seconds
  const secs = cleaned.match(/^\d+$/)
  if (secs) {
    const s = parseInt(cleaned, 10)
    if (isNaN(s) || s < 0) return null
    return s
  }

  return null
}

function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, onChangeSeconds, onCommitSeconds, validate = true, revertOnInvalid = true, className, ...props }, ref) => {
    const [internal, setInternal] = React.useState(value || '')
    const [lastValid, setLastValid] = React.useState<string>(value || '')
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
      setInternal(value || '')
      setLastValid(value || '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      setInternal(v)

      if (!validate) {
        onChange(v)
        return
      }

      // While typing, keep the raw value. Only normalize on blur/commit.
      setError(null)
    }

    const handleBlur = () => {
      if (!validate) return
      const secs = parseToSeconds(internal)
      if (secs === null) {
        setError('Enter time as mm:ss or seconds')
        if (revertOnInvalid) {
          setInternal(lastValid)
          onChange(lastValid)
        }
      } else {
        const formatted = formatSeconds(secs)
        setInternal(formatted)
        setLastValid(formatted)
        setError(null)
        onChange(formatted)
        if (onChangeSeconds) onChangeSeconds(secs)
        if (onCommitSeconds) onCommitSeconds(secs)
      }
    }

    return (
      <div className="w-full">
        <BaseInput
          ref={ref}
          value={internal}
          onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleBlur()
            }
          }}
          inputMode="numeric"
          pattern="[0-9:]*"
          className={cn('text-center text-sm', className)}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)

TimeInput.displayName = 'TimeInput'

export { TimeInput, parseToSeconds, formatSeconds }
