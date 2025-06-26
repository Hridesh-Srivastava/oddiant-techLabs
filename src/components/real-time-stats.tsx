"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

interface StatsProps {
  testId?: string
  refreshInterval?: number
}

interface TestStats {
  candidatesCount: number
  completionRate: number
  averageScore: number
  passRate: number
  passingScore?: number
  lastUpdated: string
}

export function RealTimeStats({ testId, refreshInterval = 30000 }: StatsProps) {
  const [stats, setStats] = useState<TestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      setIsRefreshing(true)
      const url = testId ? `/api/assessment/tests/${testId}/stats` : `/api/assessment/results?limit=0`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch stats")
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
        setLastRefreshed(new Date())
        setError(null)
      } else {
        throw new Error(data.message || "Failed to fetch stats")
      }
    } catch (err) {
      console.error("Error fetching stats:", err)
      setError("Failed to load stats. Please try again.")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()

    const intervalId = setInterval(fetchStats, refreshInterval)

    return () => clearInterval(intervalId)
  }, [testId, refreshInterval])

  const handleManualRefresh = () => {
    fetchStats()
  }

  if (loading && !stats) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            <button
              onClick={handleManualRefresh}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          <button
            onClick={handleManualRefresh}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Candidates</p>
            <p className="text-2xl font-bold">{stats?.candidatesCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold">{stats?.completionRate ?? 0}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg. Score</p>
            <p className="text-2xl font-bold">{stats?.averageScore !== undefined ? `${stats.averageScore}%` : "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Pass Rate {stats?.passingScore ? `(${stats.passingScore}%+)` : ""}
            </p>
            <p className="text-2xl font-bold">{stats?.passRate ?? 0}%</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-right">
          Last updated: {lastRefreshed.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}
