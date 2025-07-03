"use client"

import { useState } from "react"
import { FilterPanel } from "./filter-panel"

export default function AtsFilterPanelUsage() {
  const [filters, setFilters] = useState({
    mandatoryKeywords: [] as string[],
    preferredKeywords: [] as string[],
    location: "",
    state: "",
    educationLevel: [] as string[],
    gender: "",
    experienceRange: [0, 20],
    salaryRange: [0, 200000],
    industry: "",
    ageRange: [18, 65],
    notKeywords: [] as string[],
    atsScore: 0,
    assets: {
      bike: false,
      car: false,
      wifi: false,
      laptop: false,
    },
    shiftPreference: [] as string[],
  })

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const applyFilters = () => {
    console.log("Applying filters:", filters)
    // Here you would typically fetch data or filter existing data
  }

  const resetFilters = () => {
    setFilters({
      mandatoryKeywords: [],
      preferredKeywords: [],
      location: "",
      state: "",
      educationLevel: [],
      gender: "",
      experienceRange: [0, 20],
      salaryRange: [0, 200000],
      industry: "",
      ageRange: [18, 65],
      notKeywords: [],
      atsScore: 0,
      assets: {
        bike: false,
        car: false,
        wifi: false,
        laptop: false,
      },
      shiftPreference: [],
    })
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <FilterPanel
        filters={filters}
        setFilters={handleFilterChange}
        applyAtsScoreFilter={() => {}}
        applyCustomFilters={applyFilters}
        resetFilters={resetFilters}
      />
    </div>
  )
}
