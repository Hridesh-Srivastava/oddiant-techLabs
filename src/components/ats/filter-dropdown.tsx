"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronDown, X, Search, ArrowUpDown } from "lucide-react"

interface FilterOption {
  value: string
  label: string
  checked: boolean
}

interface FilterDropdownProps {
  title: string
  options: FilterOption[]
  onFilter: (selectedValues: string[]) => void
  onSort?: (direction: "asc" | "desc") => void
  canSort?: boolean
}

export function FilterDropdown({
  title,
  options: initialOptions,
  onFilter,
  onSort,
  canSort = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<FilterOption[]>(initialOptions)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase()))

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update options when initialOptions change
  useEffect(() => {
    setOptions(initialOptions)
  }, [initialOptions])

  // Toggle all options
  const toggleAll = (checked: boolean) => {
    setOptions(options.map((option) => ({ ...option, checked })))

    if (checked) {
      onFilter(options.map((option) => option.value))
    } else {
      onFilter([])
    }
  }

  // Toggle individual option
  const toggleOption = (index: number, checked: boolean) => {
    // Create a new array to avoid direct state mutation
    const newOptions = [...options]
    newOptions[index].checked = checked
    setOptions(newOptions)

    // Calculate selected values only once after state update
    const selectedValues = newOptions.filter((option) => option.checked).map((option) => option.value)

    // Call onFilter with the selected values
    onFilter(selectedValues)
  }

  // Sort A to Z
  const sortAtoZ = () => {
    if (onSort) onSort("asc")
    setIsOpen(false)
  }

  // Sort Z to A
  const sortZtoA = () => {
    if (onSort) onSort("desc")
    setIsOpen(false)
  }

  // Clear all filters
  const clearFilters = () => {
    toggleAll(false)
    setIsOpen(false)
  }

  // Count selected options
  const selectedCount = options.filter((option) => option.checked).length

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="flex items-center gap-1 h-9 px-3 border-gray-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium">{title}</span>
        {selectedCount > 0 && (
          <span className="flex items-center justify-center h-5 w-5 text-xs bg-primary text-primary-foreground rounded-full">
            {selectedCount}
          </span>
        )}
        <ChevronDown className="h-4 w-4 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200">
          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Filter by {title}</h3>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-8 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {canSort && (
            <div className="p-2 border-b border-gray-200">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={sortAtoZ}>
                  <ArrowUpDown className="h-4 w-4 mr-2 rotate-0" />
                  Sort A to Z
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm h-8" onClick={sortZtoA}>
                  <ArrowUpDown className="h-4 w-4 mr-2 rotate-180" />
                  Sort Z to A
                </Button>
              </div>
            </div>
          )}

          <div className="p-2 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${title}-select-all`}
                  checked={options.every((option) => option.checked)}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                />
                <Label htmlFor={`${title}-select-all`} className="text-sm cursor-pointer">
                  Select All
                </Label>
              </div>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option.value}-${index}`}
                  className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-100 rounded-sm"
                >
                  <Checkbox
                    id={`${title}-option-${index}`}
                    checked={option.checked}
                    onCheckedChange={(checked) =>
                      toggleOption(
                        options.findIndex((o) => o.value === option.value),
                        !!checked,
                      )
                    }
                  />
                  <Label htmlFor={`${title}-option-${index}`} className="flex-1 text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))
            ) : (
              <div className="text-center py-2 text-sm text-gray-500">No matching options</div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 flex justify-between">
            <div className="text-xs text-gray-500">
              Showing {filteredOptions.length} of {options.length}
            </div>
            <div className="text-xs text-gray-500">{selectedCount} selected</div>
          </div>
        </div>
      )}
    </div>
  )
}
