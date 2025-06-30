"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  User,
  LocateIcon as LocationIcon,
  Briefcase,
  Mail,
  Phone,
  Globe,
  Download,
  FileText,
  Calendar,
  Send,
  Paperclip,
  Video,
  Music,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ResumeViewerProps {
  resume: any
  highlightKeywords: boolean
  keywords: string[]
}

export function ResumeViewer({ resume, highlightKeywords, keywords }: ResumeViewerProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  // Function to highlight keywords in text
  const highlightText = (text: string) => {
    if (!text) return ""
    if (!highlightKeywords || !keywords.length) return text

    let highlightedText = text

    // Sort keywords by length (longest first) to avoid highlighting issues
    const sortedKeywords = [...keywords].filter(Boolean).sort((a, b) => b.length - a.length)

    for (const keyword of sortedKeywords) {
      if (!keyword) continue

      const regex = new RegExp(`(${keyword})`, "gi")
      highlightedText = highlightedText.replace(
        regex,
        '<span class="bg-yellow-200 rounded px-1">$1</span>',
      )
    }

    return highlightedText
  }

  // Function to handle download of candidate data as Excel
  const handleDownload = async () => {
    if (!resume || !resume._id) {
      toast.error("Cannot download: Resume data is missing")
      return
    }

    try {
      setIsExporting(true)
      const response = await fetch(`/api/employee/candidates/${resume._id}/export`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Failed to export candidate data")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `${resume.firstName || ""}_${resume.lastName || ""}_resume_data.xlsx`
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Resume data exported successfully")
    } catch (error) {
      console.error("Error exporting resume:", error)
      toast.error("Failed to export resume data")
    } finally {
      setIsExporting(false)
    }
  }

  // Function to handle contact candidate
  const handleContactCandidate = () => {
    if (!resume || !resume._id) {
      toast.error("Cannot contact: Candidate data is missing")
      return
    }

    router.push(`/employee/candidates/${resume._id}/contact`)
  }

  // If no resume is selected
  if (!resume) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <p>Select a resume to view details</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-medium">Resume Details</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleContactCandidate} className="flex items-center gap-1">
            <Send className="h-4 w-4 mr-1" />
            Contact
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4 mr-1" />
            {isExporting ? "Exporting..." : "Export to Excel"}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-3">
          {resume.photographUrl ? (
            <img
              src={resume.photographUrl || "/placeholder.svg"}
              alt={`${resume.firstName} ${resume.lastName}`}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-gray-500" />
          )}
        </div>

        <h2 className="text-xl font-bold">
          {resume.firstName} {resume.lastName}
        </h2>
        <p className="text-gray-500">{resume.currentPosition || resume.role}</p>

        <div className="flex items-center mt-2 text-sm text-gray-500">
          <LocationIcon className="h-4 w-4 mr-1" />
          <span>
            {resume.location || resume.currentCity}
            {resume.state ? `, ${resume.state}` : ""}
          </span>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-gray-500" />
          <span>{resume.email}</span>
        </div>

        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-2 text-gray-500" />
          <span>{resume.phone || "Not provided"}</span>
        </div>

        {resume.alternativePhone && (
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-gray-500" />
            <span>{resume.alternativePhone} (Alternative)</span>
          </div>
        )}

        {resume.website && (
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-2 text-gray-500" />
            <a
              href={resume.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {resume.website}
            </a>
          </div>
        )}

        {resume.linkedIn && (
          <div className="flex items-center">
            <Globe className="h-4 w-4 mr-2 text-gray-500" />
            <a
              href={resume.linkedIn.startsWith("http") ? resume.linkedIn : `https://linkedin.com/in/${resume.linkedIn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              LinkedIn Profile
            </a>
          </div>
        )}

        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
          <span>{resume.yearsOfExperience || resume.totalExperience || "0"} years experience</span>
        </div>

        {resume.gender && (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-500" />
            <span>Gender: {resume.gender}</span>
          </div>
        )}

        {resume.dateOfBirth && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span>DOB: {new Date(resume.dateOfBirth).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <Separator />

      {/* Skills */}
      <div>
        <h3 className="font-medium mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {Array.isArray(resume.skills) && resume.skills.length > 0 ? (
            resume.skills.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No skills listed</p>
          )}
        </div>
      </div>

      {/* Summary */}
      {(resume.summary || resume.profileOutline || resume.content) && (
        <div>
          <h3 className="font-medium mb-2">Summary</h3>
          <p
            className="text-gray-700"
            dangerouslySetInnerHTML={{
              __html: highlightText(resume.summary || resume.profileOutline || resume.content),
            }}
          />
        </div>
      )}

      {/* Experience */}
      {resume.experience && Array.isArray(resume.experience) && resume.experience.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Experience</h3>
          <div className="space-y-4">
            {resume.experience.map((exp: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{exp.title}</h4>
                      <p className="text-sm text-gray-500">{exp.companyName}</p>
                      {exp.department && <p className="text-xs text-gray-500">Department: {exp.department}</p>}
                    </div>
                    <Badge variant="outline">
                      {exp.startDate || ""} - {exp.endDate || exp.tenure || "Present"}
                    </Badge>
                  </div>
                  {exp.description || exp.summary ? (
                    <p
                      className="mt-2 text-sm text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(exp.description || exp.summary),
                      }}
                    />
                  ) : null}
                  {(exp.currentSalary || exp.expectedSalary) && (
                    <div className="mt-2 text-xs text-gray-500">
                      {exp.currentSalary && <span>Current Salary: {exp.currentSalary} </span>}
                      {exp.expectedSalary && <span>• Expected: {exp.expectedSalary}</span>}
                    </div>
                  )}
                  {exp.noticePeriod && (
                    <div className="mt-1 text-xs text-gray-500">
                      <span>Notice Period: {exp.noticePeriod} days</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resume.education && Array.isArray(resume.education) && resume.education.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Education</h3>
          <div className="space-y-4">
            {resume.education.map((edu: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{edu.degree}</h4>
                      <p className="text-sm text-gray-500">{edu.institution}</p>
                      {edu.level && <p className="text-xs text-gray-500">Level: {edu.level}</p>}
                      {edu.mode && <p className="text-xs text-gray-500">Mode: {edu.mode}</p>}
                    </div>
                    <Badge variant="outline">
                      {edu.startYear || ""} - {edu.endYear || "Present"}
                    </Badge>
                  </div>
                  {edu.percentage && <p className="mt-1 text-xs text-gray-500">Percentage/CGPA: {edu.percentage}</p>}
                  {edu.description && (
                    <p
                      className="mt-2 text-sm text-gray-700"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(edu.description),
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {resume.certifications && Array.isArray(resume.certifications) && resume.certifications.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Certifications</h3>
          <div className="space-y-2">
            {resume.certifications.map((cert: string, index: number) => (
              <Badge key={index} variant="outline" className="mr-2 mb-2">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Shift Preference */}
      {resume.shiftPreference && Array.isArray(resume.shiftPreference) && resume.shiftPreference.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Shift Preference</h3>
          <div className="flex flex-wrap gap-2">
            {resume.shiftPreference.map((shift: string, index: number) => (
              <Badge key={index} variant="outline">
                {shift}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Preferred Cities */}
      {resume.preferredCities && Array.isArray(resume.preferredCities) && resume.preferredCities.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Preferred Cities</h3>
          <div className="flex flex-wrap gap-2">
            {resume.preferredCities.map((city: string, index: number) => (
              <Badge key={index} variant="outline">
                {city}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Available Assets */}
      {resume.availableAssets && Array.isArray(resume.availableAssets) && resume.availableAssets.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Available Assets</h3>
          <div className="flex flex-wrap gap-2">
            {resume.availableAssets.map((asset: string, index: number) => (
              <Badge key={index} variant="outline">
                {asset.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Identity Documents */}
      {resume.identityDocuments && Array.isArray(resume.identityDocuments) && resume.identityDocuments.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Identity Documents</h3>
          <div className="flex flex-wrap gap-2">
            {resume.identityDocuments.map((doc: string, index: number) => (
              <Badge key={index} variant="outline">
                {doc.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Cover Letter */}
      {resume.coverLetter && (
        <div>
          <h3 className="font-medium mb-2">Cover Letter</h3>
          <Card>
            <CardContent className="p-4">
              <p
                className="whitespace-pre-line text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: highlightText(resume.coverLetter),
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Information */}
      {resume.additionalInfo && (
        <div>
          <h3 className="font-medium mb-2">Additional Information</h3>
          <Card>
            <CardContent className="p-4">
              <p
                className="whitespace-pre-line text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: highlightText(resume.additionalInfo),
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents & Media */}
      <div>
        <h3 className="font-medium mb-2">Documents & Media</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resume.resumeUrl && (
            <div className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-gray-500" />
              <a
                href={resume.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Resume
              </a>
            </div>
          )}

          {resume.videoResumeUrl && (
            <div className="flex items-center space-x-2">
              <Video className="h-4 w-4 text-gray-500" />
              <a
                href={resume.videoResumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Video Resume
              </a>
            </div>
          )}

          {resume.audioBiodataUrl && (
            <div className="flex items-center space-x-2">
              <Music className="h-4 w-4 text-gray-500" />
              <a
                href={resume.audioBiodataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Listen to Audio Biodata
              </a>
            </div>
          )}

          {resume.photographUrl && (
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              <a
                href={resume.photographUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Photograph
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Full Resume Content */}
      {resume.content && (
        <div>
          <h3 className="font-medium mb-2">Full Resume</h3>
          <Card>
            <CardContent className="p-4">
              <p
                className="whitespace-pre-line text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: highlightText(resume.content),
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
