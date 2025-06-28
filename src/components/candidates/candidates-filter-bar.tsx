"use client"

import { useState, useEffect } from "react"
import { FilterDropdown } from "../ats/filter-dropdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface Candidate {
  _id: string
  name: string
  email: string
  emailAddress?: string
  role: string
  status: string
  avatar?: string
  appliedDate: string
  skills: string[]
  location: string
  currentCity?: string
  city?: string
  currentState?: string
  yearsOfExperience: number
  currentPosition: string
  designation?: string
  content: string
  profileOutline?: string
  summary?: string
  aboutMe?: string
  description?: string
  firstName: string
  lastName: string
  middleName?: string
  phone: string
  mobileNumber?: string
  website: string
  experience: any[]
  education: any[]
  matchScore: number
  gender: string
  state: string
  currentSalary: number
  age: number
  industry?: string
  collection?: string
  employerId: string
}

interface CandidatesFilterBarProps {
  candidates: Candidate[]
  onFilterChange: (filteredCandidates: Candidate[]) => void
}

export function CandidatesFilterBar({ candidates, onFilterChange }: CandidatesFilterBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [activeFilters, setActiveFilters] = useState(0)

  // Extract unique values for filter options
  const positions = Array.from(new Set(candidates.map((c) => c.role))).map((value) => ({
    value,
    label: value,
    checked: false,
  }))

  const statuses = Array.from(new Set(candidates.map((c) => c.status))).map((value) => ({
    value,
    label: value,
    checked: false,
  }))

  // Group dates by month for filtering
  const dateOptions = Array.from(
    new Set(
      candidates.map((c) => {
        const date = new Date(c.appliedDate)
        return `${date.getMonth() + 1}/${date.getFullYear()}`
      }),
    ),
  ).map((value) => ({
    value,
    label: value,
    checked: false,
  }))

  // Apply filters whenever filter selections change
  useEffect(() => {
    // Create a copy of candidates to avoid modifying the original array
    let filteredResults = [...candidates]

    // Apply search filter
    if (searchTerm) {
      filteredResults = filteredResults.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply position filter
    if (selectedPositions.length > 0) {
      filteredResults = filteredResults.filter((candidate) => selectedPositions.includes(candidate.role))
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filteredResults = filteredResults.filter((candidate) => selectedStatuses.includes(candidate.status))
    }

    // Apply date filter
    if (selectedDates.length > 0) {
      filteredResults = filteredResults.filter((candidate) => {
        const date = new Date(candidate.appliedDate)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
        return selectedDates.includes(monthYear)
      })
    }

    // Count active filters
    let filterCount = 0
    if (selectedPositions.length > 0) filterCount++
    if (selectedStatuses.length > 0) filterCount++
    if (selectedDates.length > 0) filterCount++
    setActiveFilters(filterCount)

    // Update parent component with filtered results
    onFilterChange(filteredResults)

    // Only include dependencies that should trigger a re-filter
  }, [searchTerm, selectedPositions, selectedStatuses, selectedDates, candidates, onFilterChange])

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("")
    setSelectedPositions([])
    setSelectedStatuses([])
    setSelectedDates([])
  }

  // Sort candidates by position
  const handlePositionSort = (direction: "asc" | "desc") => {
    const sorted = [...candidates].sort((a, b) => {
      if (direction === "asc") {
        return a.role.localeCompare(b.role)
      } else {
        return b.role.localeCompare(a.role)
      }
    })
    onFilterChange(sorted)
  }

  // Sort candidates by status
  const handleStatusSort = (direction: "asc" | "desc") => {
    const sorted = [...candidates].sort((a, b) => {
      if (direction === "asc") {
        return a.status.localeCompare(b.status)
      } else {
        return b.status.localeCompare(a.status)
      }
    })
    onFilterChange(sorted)
  }

  // Sort candidates by date
  const handleDateSort = (direction: "asc" | "desc") => {
    const sorted = [...candidates].sort((a, b) => {
      const dateA = new Date(a.appliedDate).getTime()
      const dateB = new Date(b.appliedDate).getTime()

      if (direction === "asc") {
        return dateA - dateB
      } else {
        return dateB - dateA
      }
    })
    onFilterChange(sorted)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search candidates..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <FilterDropdown
        title="Position"
        options={positions}
        onFilter={setSelectedPositions}
        onSort={handlePositionSort}
        canSort={true}
      />

      <FilterDropdown
        title="Status"
        options={statuses}
        onFilter={setSelectedStatuses}
        onSort={handleStatusSort}
        canSort={true}
      />

      <FilterDropdown
        title="Applied Date"
        options={dateOptions}
        onFilter={setSelectedDates}
        onSort={handleDateSort}
        canSort={true}
      />

      {activeFilters > 0 && (
        <Button variant="outline" size="sm" className="h-9 gap-1" onClick={clearAllFilters}>
          <X className="h-4 w-4" />
          Clear Filters
          <span className="ml-1 flex items-center justify-center h-5 w-5 text-xs bg-primary text-primary-foreground rounded-full">
            {activeFilters}
          </span>
        </Button>
      )}
    </div>
  )
}
