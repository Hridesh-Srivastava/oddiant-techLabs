"use client"

import { useState, useEffect } from "react"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast, Toaster } from "sonner"
import { Search, Filter, Download, FileText, MapPin, Briefcase, RefreshCw } from "lucide-react"
import { ResumeViewer } from "@/components/ats/resume-viewer"
import { FilterPanel } from "@/components/ats/filter-panel"
import { BooleanSearch } from "@/components/ats/boolean-search"
import { dummyResumes } from "@/lib/dummy-data"

export default function ATSPage() {
  const [activeTab, setActiveTab] = useState("resumes")
  const [resumes, setResumes] = useState(dummyResumes)
  const [filteredResumes, setFilteredResumes] = useState(dummyResumes)
 const [selectedResume, setSelectedResume] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
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
  })
  const [showFilters, setShowFilters] = useState(false)
  const [highlightKeywords, setHighlightKeywords] = useState(true)

  // Handle search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredResumes(resumes)
      return
    }

    const filtered = resumes.filter((resume) => {
      const fullName = `${resume.firstName} ${resume.lastName}`.toLowerCase()
      const content = resume.content.toLowerCase()
      const searchLower = searchTerm.toLowerCase()

      return (
        fullName.includes(searchLower) ||
        content.includes(searchLower) ||
        resume.email.toLowerCase().includes(searchLower) ||
        resume.location.toLowerCase().includes(searchLower) ||
        resume.currentPosition.toLowerCase().includes(searchLower)
      )
    })

    setFilteredResumes(filtered)
  }, [searchTerm, resumes])

  // Apply filters
  const applyFilters = () => {
    setIsLoading(true)

    setTimeout(() => {
      let filtered = [...resumes]

      // Apply mandatory keywords filter
      if (filters.mandatoryKeywords.length > 0) {
        filtered = filtered.filter((resume) => {
          return filters.mandatoryKeywords.every((keyword) =>
            resume.content.toLowerCase().includes(keyword.toLowerCase()),
          )
        })
      }

      // Apply preferred keywords filter (boost score but don't filter out)
      if (filters.preferredKeywords.length > 0) {
        // In a real implementation, this would adjust a score
        // For now, we'll just sort by the number of preferred keywords matched
        filtered.sort((a, b) => {
          const aMatches = filters.preferredKeywords.filter((keyword) =>
            a.content.toLowerCase().includes(keyword.toLowerCase()),
          ).length

          const bMatches = filters.preferredKeywords.filter((keyword) =>
            b.content.toLowerCase().includes(keyword.toLowerCase()),
          ).length

          return bMatches - aMatches
        })
      }

      // Apply location filter
      if (filters.location) {
        filtered = filtered.filter((resume) => resume.location.toLowerCase().includes(filters.location.toLowerCase()))
      }

      // Apply state filter
      if (filters.state) {
        filtered = filtered.filter((resume) => resume.state.toLowerCase().includes(filters.state.toLowerCase()))
      }

      // Apply education level filter
      if (filters.educationLevel.length > 0) {
        filtered = filtered.filter((resume) =>
          filters.educationLevel.some((level) =>
            resume.education.some((edu) => edu.degree.toLowerCase().includes(level.toLowerCase())),
          ),
        )
      }

      // Apply gender filter
      if (filters.gender) {
        filtered = filtered.filter((resume) => resume.gender.toLowerCase() === filters.gender.toLowerCase())
      }

      // Apply experience range filter
      filtered = filtered.filter(
        (resume) =>
          resume.yearsOfExperience >= filters.experienceRange[0] &&
          resume.yearsOfExperience <= filters.experienceRange[1],
      )

      // Apply salary range filter
      filtered = filtered.filter(
        (resume) => resume.currentSalary >= filters.salaryRange[0] && resume.currentSalary <= filters.salaryRange[1],
      )

      // Apply industry filter
      if (filters.industry) {
        filtered = filtered.filter((resume) => resume.industry.toLowerCase() === filters.industry.toLowerCase())
      }

      // Apply age range filter
      filtered = filtered.filter((resume) => resume.age >= filters.ageRange[0] && resume.age <= filters.ageRange[1])

      // Apply NOT keywords filter
      if (filters.notKeywords.length > 0) {
        filtered = filtered.filter((resume) => {
          return !filters.notKeywords.some((keyword) => resume.content.toLowerCase().includes(keyword.toLowerCase()))
        })
      }

      setFilteredResumes(filtered)
      setIsLoading(false)

      toast.success(`Found ${filtered.length} matching resumes`)
    }, 500) // Simulate API delay
  }

  const resetFilters = () => {
    setFilters({
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
    })

    setFilteredResumes(resumes)
    toast.info("Filters have been reset")
  }

  const handleExport = () => {
    setIsExporting(true)

    setTimeout(() => {
      // In a real implementation, this would generate an Excel file
      // For now, we'll just simulate the export

      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(filteredResumes, null, 2))}`

      const link = document.createElement("a")
      link.href = jsonString
      link.download = "ats_resumes_export.json"
      link.click()

      setIsExporting(false)
      toast.success("Resumes exported successfully")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-center" />
      <EmployeeNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Applicant Tracking System</h1>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || filteredResumes.length === 0}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? "Exporting..." : "Export to Excel"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filters Panel */}
          {showFilters && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Filters</span>
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                 <FilterPanel filters={filters} setFilters={setFilters} applyFilters={applyFilters} resetFilters={resetFilters} />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={showFilters ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                  <CardTitle>Resume Database</CardTitle>

                  <div className="flex items-center space-x-2">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        placeholder="Search resumes..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setIsLoading(true)
                        setTimeout(() => {
                          setIsLoading(false)
                          toast.success("Resumes refreshed")
                        }, 500)
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Tabs defaultValue="resumes" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="resumes">Resumes</TabsTrigger>
                    <TabsTrigger value="boolean-search">Boolean Search</TabsTrigger>
                  </TabsList>

                  <TabsContent value="resumes" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-500">
                        {filteredResumes.length} {filteredResumes.length === 1 ? "resume" : "resumes"} found
                      </p>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="highlight-keywords"
                          checked={highlightKeywords}
                          onCheckedChange={(checked) => setHighlightKeywords(!!checked)}
                        />
                        <Label htmlFor="highlight-keywords">Highlight Keywords</Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Resume List */}
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b">
                          <h3 className="font-medium">Candidates</h3>
                        </div>

                        <div className="divide-y max-h-[600px] overflow-y-auto">
                          {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                            </div>
                          ) : filteredResumes.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No resumes match your criteria</div>
                          ) : (
                            filteredResumes.map((resume) => (
                              <div
                                key={resume.id}
                                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                  selectedResume?.id === resume.id ? "bg-gray-100 dark:bg-gray-800" : ""
                                }`}
                                onClick={() => setSelectedResume(resume)}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium">
                                      {resume.firstName} {resume.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-500">{resume.currentPosition}</p>
                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      <span>{resume.location}</span>
                                      <span className="mx-2">•</span>
                                      <Briefcase className="h-3 w-3 mr-1" />
                                      <span>{resume.yearsOfExperience} years</span>
                                    </div>
                                  </div>

                                  <Badge variant="outline" className="text-xs">
                                    {resume.matchScore}%
                                  </Badge>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1">
                                  {resume.skills.slice(0, 3).map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {resume.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{resume.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Resume Viewer */}
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b">
                          <h3 className="font-medium">Resume Preview</h3>
                        </div>

                        <div className="p-4 max-h-[600px] overflow-y-auto">
                          {selectedResume ? (
                            <ResumeViewer
                              resume={selectedResume}
                              highlightKeywords={highlightKeywords}
                              keywords={[...filters.mandatoryKeywords, ...filters.preferredKeywords, searchTerm].filter(
                                Boolean,
                              )}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                              <FileText className="h-12 w-12 mb-4 text-gray-300" />
                              <p>Select a resume to view details</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="boolean-search">
                    <BooleanSearch
                      resumes={resumes}
                      setFilteredResumes={setFilteredResumes}
                      setSelectedResume={setSelectedResume}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
