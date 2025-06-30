"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Info, MapPin, Briefcase } from "lucide-react"
import { toast } from "sonner"

interface BooleanSearchProps {
  resumes: any[]
  setFilteredResumes: (resumes: any[]) => void
  setSelectedResume: (resume: any) => void
}

export function BooleanSearch({ resumes, setFilteredResumes, setSelectedResume }: BooleanSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query")
      return
    }

    setIsSearching(true)

    setTimeout(() => {
      try {
        // Parse the boolean search query
        const results = performBooleanSearch(searchQuery, resumes)
        setSearchResults(results)
        setFilteredResumes(results)

        toast.success(`Found ${results.length} matching resumes`)
      } catch (error: any) {
        toast.error(error.message || "Invalid search query")
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const performBooleanSearch = (query: string, data: any[]): any[] => {
    // This is a simplified boolean search implementation
    // In a real system, this would be much more sophisticated

    // Normalize the query
    const normalizedQuery = query.trim().toLowerCase()

    // Handle empty query
    if (!normalizedQuery) return data

    // Parse AND, OR, NOT, (), and * operators

    // Handle AND operator (default for space-separated terms)
    if (normalizedQuery.includes(" AND ") || (!normalizedQuery.includes(" OR ") && normalizedQuery.includes(" "))) {
      const terms = normalizedQuery.split(" AND ").map((term) => term.trim())

      return data.filter((resume) => {
        const content = resume.content?.toLowerCase() || ""
        return terms.every((term) => {
          // Skip empty terms
          if (!term) return true

          // Handle NOT operator
          if (term.startsWith("NOT ")) {
            const notTerm = term.substring(4).trim()
            return !content.includes(notTerm)
          }

          return content.includes(term)
        })
      })
    }

    // Handle OR operator
    if (normalizedQuery.includes(" OR ")) {
      const terms = normalizedQuery.split(" OR ").map((term) => term.trim())

      return data.filter((resume) => {
        const content = resume.content?.toLowerCase() || ""
        return terms.some((term) => {
          // Skip empty terms
          if (!term) return false

          // Handle NOT operator
          if (term.startsWith("NOT ")) {
            const notTerm = term.substring(4).trim()
            return !content.includes(notTerm)
          }

          return content.includes(term)
        })
      })
    }

    // Handle continuous words with *
    if (normalizedQuery.includes("*")) {
      const pattern = normalizedQuery.replace(/\*/g, "\\S*")
      const regex = new RegExp(pattern, "i")

      return data.filter((resume) => regex.test(resume.content || ""))
    }

    // Handle NOT operator
    if (normalizedQuery.startsWith("NOT ")) {
      const term = normalizedQuery.substring(4).trim()
      return data.filter((resume) => !(resume.content || "").toLowerCase().includes(term))
    }

    // Simple term search (default)
    return data.filter((resume) => (resume.content || "").toLowerCase().includes(normalizedQuery))
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex items-start gap-2 mb-4">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Boolean Search Syntax:</p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
              <li>
                <code className="bg-gray-200 px-1 rounded">AND</code> - Both terms must be present
                (default for space-separated terms)
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">OR</code> - Either term must be present
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">NOT</code> - Term must not be present
              </li>
              <li>
                <code className="bg-gray-200 px-1 rounded">*</code> - Wildcard for continuous words
              </li>
            </ul>
            <p className="mt-2">
              Example:{" "}
              <code className="bg-gray-200 px-1 rounded">
                java AND (spring OR hibernate) NOT junior
              </code>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="boolean-search">Search Query</Label>
          <div className="flex space-x-2">
            <Input
              id="boolean-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter boolean search query..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-4">Search Results ({searchResults.length})</h3>

          {isSearching ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery.trim() ? "No results found" : "Enter a search query to find resumes"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((resume) => (
                <Card
                  key={resume._id}
                  className="cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => setSelectedResume(resume)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {resume.firstName} {resume.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">{resume.currentPosition || resume.role}</p>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>{resume.location || resume.currentCity || "N/A"}</span>
                          <span className="mx-2">•</span>
                          <Briefcase className="h-3 w-3 mr-1" />
                          <span>{resume.yearsOfExperience || resume.totalExperience || "0"} years</span>
                        </div>
                      </div>

                      <Badge variant="outline" className="text-xs">
                        {resume.matchScore || 0}%
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {(resume.skills || []).slice(0, 3).map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {(resume.skills || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(resume.skills || []).length - 3}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
