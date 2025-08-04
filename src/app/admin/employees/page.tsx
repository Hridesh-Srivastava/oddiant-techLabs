"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { RotateCw, Search, Eye, Filter, AlertCircle, LogOut } from "lucide-react"

interface Employee {
  _id: string
  firstName: string
  lastName: string
  email: string
  companyName: string
  companyLocation: string
  designation: string
  verified: boolean
  rejected: boolean
}

export default function AdminEmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all") // all, pending, verified, rejected
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmailAccess, setIsEmailAccess] = useState(false)

  // Function to fetch employees data
  const fetchEmployees = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/employees", {
        cache: "no-store",
        headers: {
          pragma: "no-cache",
          "cache-control": "no-cache",
        },
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data && Array.isArray(data.employees)) {
        setEmployees(data.employees)
        setIsEmailAccess(data.isEmailAccess || false)
      } else if (Array.isArray(data)) {
        setEmployees(data)
      } else {
        console.error("Unexpected data format:", data)
        setEmployees([])
        toast.error("Received invalid data format from server")
      }
    } catch (error: any) {
      console.error("Failed to fetch employees:", error)
      setError(error.message || "Failed to fetch employees")

      if (error.message.includes("401")) {
        toast.error("Authentication failed. Please log in again.")
      } else {
        toast.error("Failed to fetch employees")
      }
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchEmployees()

    // Set up polling for real-time updates (only if not email access)
    const intervalId = setInterval(() => {
      if (!isEmailAccess) {
        fetchEmployees()
      }
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(intervalId)
  }, [isEmailAccess])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchEmployees()
      toast.success("Data refreshed successfully")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleViewEmployee = (employeeId: string) => {
    router.push(`/admin/verify-employee/${employeeId}`)
  }

  const handleLogin = () => {
    router.push("/auth/employee/login")
  }

  // Ensure employees is always an array before filtering
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter((employee) => {
        const searchTermLower = searchTerm.toLowerCase()
        const fullName = `${employee.firstName || ""} ${employee.lastName || ""}`.toLowerCase()
        const email = employee.email?.toLowerCase() || ""
        const companyName = employee.companyName?.toLowerCase() || ""

        const matchesSearchTerm =
          fullName.includes(searchTermLower) || email.includes(searchTermLower) || companyName.includes(searchTermLower)

        let matchesFilter = true
        if (filter !== "all") {
          if (filter === "verified") {
            matchesFilter = employee.verified === true
          } else if (filter === "rejected") {
            matchesFilter = employee.rejected === true
          } else if (filter === "pending") {
            matchesFilter = !employee.verified && !employee.rejected
          }
        }

        return matchesSearchTerm && matchesFilter
      })
    : []

  const getStatusBadge = (employee: Employee) => {
    if (employee.verified) {
      return <Badge className="bg-green-300 text-green-700 hover:bg-green-400">Verified</Badge>
    } else if (employee.rejected) {
      return <Badge className="bg-red-200 text-red-700 hover:bg-red-300">Rejected</Badge>
    } else {
      return <Badge className="bg-yellow-200 text-yellow-700 hover:bg-yellow-300">Pending</Badge>
    }
  }

  if (error && error.includes("401")) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-700 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <Button onClick={handleLogin} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 min-h-screen">
      <Toaster richColors />

      {isEmailAccess && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700">
            📧 You are accessing this page through an email link. Some features may be limited.
          </p>
        </div>
      )}

      <h1 className="text-3xl font-semibold mb-6 text-black">Manage Employers</h1>

      <div className="flex justify-end mb-4">
        <Button
          className="flex items-center gap-2 bg-black text-white hover:text-black hover:bg-green-600 px-4 py-2 rounded-lg shadow-md transition-colors duration-150 font-semibold text-base"
          onClick={async () => {
            try {
              const res = await fetch("/api/auth/logout", { method: "POST" })
              if (res.ok) {
                toast.success("Logged out successfully")
                router.push("/auth/employee/login")
              } else {
                toast.error("Logout failed")
              }
            } catch {
              toast.error("Logout failed")
            }
          }}
        >
          <span className="font-medium">Logout</span>
          <span className="ml-2 flex items-center justify-center w-7 h-7 rounded transition-colors">
            <LogOut className="w-4 h-4" />
          </span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-2">
        <div className="flex flex-col md:flex-row items-center gap-2 w-full">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black" />
            <Input
              type="search"
              placeholder="Search by name, email, or company..."
              className="pl-10 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="ghost"
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="flex-shrink-0 bg-white text-black hover:bg-gray-200"
          >
            <RotateCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="h-4 w-4 text-gray-500" />
            <select className="border rounded px-2 py-1" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-10 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-700 font-medium">Error loading employees</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            Try Again
          </Button>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No employees found matching your criteria</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee._id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <div className="flex items-center">
                      <div className="ml-3">
                        <p className="text-gray-900 whitespace-no-wrap">
                          {employee.firstName || ""} {employee.lastName || ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{employee.email || ""}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">{employee.companyName || ""}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{getStatusBadge(employee)}</td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <Button className="bg-black text-white hover:text-black hover:bg-green-600" variant="outline" size="sm" onClick={() => handleViewEmployee(employee._id)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
