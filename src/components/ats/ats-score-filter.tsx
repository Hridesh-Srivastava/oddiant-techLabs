"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AtsScoreFilterProps {
  onFilterChange: (minScore: number) => void
}

export function AtsScoreFilter({ onFilterChange }: AtsScoreFilterProps) {
  const [minScore, setMinScore] = useState(0)

  const handleScoreChange = (value: number[]) => {
    setMinScore(value[0])
  }

  const handleApplyFilter = () => {
    onFilterChange(minScore)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ATS Score Filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="ats-score">ATS Resume Score Prediction</Label>
            <span className="text-sm font-medium">{minScore}%</span>
          </div>
          <Slider
            id="ats-score"
            min={0}
            max={100}
            step={5}
            value={[minScore]}
            onValueChange={handleScoreChange}
            className="py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setMinScore(0)}>
            Reset
          </Button>
          <Button onClick={handleApplyFilter}>Apply Filter</Button>
        </div>
      </CardContent>
    </Card>
  )
}
