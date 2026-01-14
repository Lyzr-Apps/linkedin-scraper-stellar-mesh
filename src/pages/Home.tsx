import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Search, ExternalLink, Briefcase, User, Building2 } from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'

// Agent ID from response schema
const LINKEDIN_PROFILE_AGENT_ID = "6966a9221f8ceefab63133cd"

// TypeScript interfaces from ACTUAL test response
interface LinkedInResult {
  linkedin_url: string
  job_title: string
  person_name: string
  company_name: string
}

interface LinkedInResponse extends NormalizedAgentResponse {
  result: LinkedInResult
}

export default function Home() {
  const [personName, setPersonName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<LinkedInResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!personName.trim() || !companyName.trim()) {
      setError('Please enter both person name and company name')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const message = `Find LinkedIn profile for ${personName} at ${companyName}`
      const result = await callAIAgent(message, LINKEDIN_PROFILE_AGENT_ID)

      if (result.success && result.response.status === 'success') {
        setResponse(result.response as LinkedInResponse)
      } else {
        setError(result.response.message || result.error || 'Profile not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-600/20">
              <Search className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">LinkedIn Profile Finder</h1>
              <p className="text-slate-600 mt-1">Find LinkedIn profiles and job titles instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Search Card */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Search Profile</CardTitle>
              <CardDescription className="text-base">
                Enter a person's name and their company to find their LinkedIn profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Person Name Input */}
              <div className="space-y-2">
                <Label htmlFor="person-name" className="text-base font-medium text-slate-700">
                  Person Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="person-name"
                    type="text"
                    placeholder="e.g., Marc Benioff"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="pl-11 h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Company Name Input */}
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-base font-medium text-slate-700">
                  Company Name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="e.g., Salesforce"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={loading}
                    className="pl-11 h-12 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={loading || !personName.trim() || !companyName.trim()}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Find LinkedIn Profile
                  </>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Card */}
          {response && response.result && (
            <Card className="mt-6 shadow-xl border-slate-200 bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-slate-900">Profile Found</CardTitle>
                <CardDescription className="text-base">
                  Here's the LinkedIn profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Person Info */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 font-medium mb-1">Name</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {response.result.person_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <Building2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 font-medium mb-1">Company</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {response.result.company_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 font-medium mb-1">Job Title</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {response.result.job_title}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* LinkedIn URL */}
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 font-medium">LinkedIn Profile</p>
                  <a
                    href={response.result.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-600/20 group"
                  >
                    <span className="font-semibold">View Profile on LinkedIn</span>
                    <ExternalLink className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-xs text-slate-500 break-all px-2">
                    {response.result.linkedin_url}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State - Instructions */}
          {!response && !loading && !error && (
            <Card className="mt-6 border-dashed border-2 border-slate-300 bg-slate-50/50">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="bg-slate-200 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Ready to find LinkedIn profiles
                </h3>
                <p className="text-slate-600 mb-4 max-w-md mx-auto">
                  Enter a person's name and company above, then click "Find LinkedIn Profile" to get started
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <User className="h-4 w-4" />
                    <span>Professional profiles</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <Briefcase className="h-4 w-4" />
                    <span>Job titles</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <ExternalLink className="h-4 w-4" />
                    <span>Direct LinkedIn links</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-white/80 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-6 py-6">
          <p className="text-center text-slate-600 text-sm">
            Powered by AI Agent Technology
          </p>
        </div>
      </div>
    </div>
  )
}
