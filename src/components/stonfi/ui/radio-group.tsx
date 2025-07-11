import * as React from "react"

type RadioGroupProps = {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

const RadioGroup = ({ value, onValueChange, children, className }: RadioGroupProps) => {
  const [selectedValue, setSelectedValue] = React.useState(value || "")

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div role="radiogroup" className={className}>
      {React.Children.map(children, (child) =>
        React.isValidElement<RadioGroupItemProps>(child) // Ensure TypeScript understands the expected props
          ? React.cloneElement(child, {
              checked: child.props.value === selectedValue,
              onChange: () => handleChange(child.props.value),
            } as Partial<RadioGroupItemProps>) // Cast to expected type
          : child
      )}
    </div>
  )
}

type RadioGroupItemProps = {
  id: string
  value: string
  checked?: boolean
  onChange?: () => void
  className?: string
}

const RadioGroupItem = ({ id, value, checked, onChange, className }: RadioGroupItemProps) => {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      className={`h-5 w-5 cursor-pointer border-2 border-gray-400 rounded-full focus:ring-2 focus:ring-blue-light ${className}`}
    />
  )
}

export { RadioGroup, RadioGroupItem }
