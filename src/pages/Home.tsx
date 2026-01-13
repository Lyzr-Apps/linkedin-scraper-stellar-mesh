import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  Loader2,
  ChevronDown,
  ChevronUp,
  Download,
  Trash2,
  Building2,
  User,
  MapPin,
  Briefcase,
  Mail,
  Globe,
  Users,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { callAIAgent } from '@/utils/aiAgent'
import type { NormalizedAgentResponse } from '@/utils/aiAgent'
import { cn } from '@/lib/utils'

// Agent ID from workflow.json
const ACCOUNT_ENRICHMENT_COORDINATOR_ID = "6966a93ce2fc11fb41b46498"

// TypeScript interfaces based on ACTUAL test response structure
interface CompanyInfo {
  company_name: string
  industry: string
  business_context: string
  recent_news: string[]
}

interface ContactProfile {
  name?: string
  job_title?: string
  linkedin_url?: string
  email?: string
  location?: string
}

interface EnrichedAccount {
  account_id: string
  company_info?: CompanyInfo
  contact_profiles?: ContactProfile[]
  enrichment_summary?: string
  status?: 'enriched' | 'partial' | 'not_found'
}

interface EnrichmentResult {
  enriched_accounts: EnrichedAccount[]
  total_enriched: string | number
  timestamp?: string
}

// Sub-components defined OUTSIDE Home() to prevent re-creation
function HeaderBar() {
  return (
    <div className="border-b bg-white">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Enrichment</h1>
              <p className="text-sm text-gray-500">LinkedIn & Company Research Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1.5" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FileDropzone({ onFileSelect, disabled }: { onFileSelect: (file: File) => void; disabled: boolean }) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith('.csv')) {
      onFileSelect(file)
    }
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging && !disabled ? "border-blue-500 bg-blue-50" : "border-gray-300",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p className="text-sm text-gray-600 mb-2">Drag and drop CSV file here, or</p>
      <label>
        <Button variant="outline" disabled={disabled} asChild>
          <span>
            Browse Files
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
              disabled={disabled}
            />
          </span>
        </Button>
      </label>
      <p className="text-xs text-gray-500 mt-3">CSV files only (max 10MB)</p>
    </div>
  )
}

function StatusBadge({ status }: { status: 'enriched' | 'partial' | 'not_found' | 'processing' }) {
  const variants = {
    enriched: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    partial: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle },
    not_found: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 }
  }

  const variant = variants[status]
  const Icon = variant.icon

  return (
    <Badge variant="outline" className={cn("border", variant.color)}>
      <Icon className={cn("h-3 w-3 mr-1", status === 'processing' && "animate-spin")} />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  )
}

function AccountRow({ account, index }: { account: EnrichedAccount; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const companyName = account.company_info?.company_name || account.account_id.split('.')[0] || 'Unknown'
  const domain = account.account_id
  const industry = account.company_info?.industry || '-'
  const status = account.status || (account.company_info ? 'enriched' : 'partial')

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="font-medium">{index + 1}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-gray-900">{companyName}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="h-3 w-3" />
            {domain}
          </div>
        </TableCell>
        <TableCell>
          <span className="text-sm text-gray-600">{industry}</span>
        </TableCell>
        <TableCell>
          <StatusBadge status={status} />
        </TableCell>
        <TableCell>
          <span className="text-sm text-gray-600">
            {account.contact_profiles?.length || 0} contacts
          </span>
        </TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="bg-gray-50 p-6">
            <div className="space-y-6">
              {/* Company Information */}
              {account.company_info && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Company Name:</span>
                      <p className="text-gray-900 font-medium mt-1">{account.company_info.company_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Industry:</span>
                      <p className="text-gray-900 font-medium mt-1">{account.company_info.industry}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="text-gray-500 text-sm">Business Context:</span>
                    <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                      {account.company_info.business_context}
                    </p>
                  </div>

                  {account.company_info.recent_news && account.company_info.recent_news.length > 0 && (
                    <div className="mt-4">
                      <span className="text-gray-500 text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Recent News:
                      </span>
                      <ul className="mt-2 space-y-2">
                        {account.company_info.recent_news.map((news, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-blue-600">•</span>
                            <span>{news}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Profiles */}
              {account.contact_profiles && account.contact_profiles.length > 0 && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contact Profiles ({account.contact_profiles.length})
                  </h4>
                  <div className="grid gap-3">
                    {account.contact_profiles.map((contact, i) => (
                      <div key={i} className="border rounded-lg p-4 bg-white">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {contact.name && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-900 font-medium">{contact.name}</span>
                            </div>
                          )}
                          {contact.job_title && (
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{contact.job_title}</span>
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{contact.email}</span>
                            </div>
                          )}
                          {contact.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">{contact.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enrichment Summary */}
              {account.enrichment_summary && (
                <div>
                  <Separator className="my-4" />
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Enrichment Summary
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {account.enrichment_summary}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export default function Home() {
  const [manualInput, setManualInput] = useState('')
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enrichedAccounts, setEnrichedAccounts] = useState<EnrichedAccount[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((file: File) => {
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').slice(1).filter(line => line.trim())
      const accounts = lines.map(line => {
        const [name, domain] = line.split(',').map(s => s.trim())
        return domain ? `${name} (${domain})` : name
      })
      setManualInput(accounts.join('\n'))
    }
    reader.readAsText(file)
  }, [])

  const handleEnrichAccounts = async () => {
    if (!manualInput.trim()) {
      setError('Please provide account data to enrich')
      return
    }

    setLoading(true)
    setError(null)
    setProgress(0)

    try {
      const accounts = manualInput.split('\n').filter(line => line.trim())
      const message = `Enrich accounts: ${accounts.join(', ')}`

      setProgress(30)

      const result = await callAIAgent(message, ACCOUNT_ENRICHMENT_COORDINATOR_ID)

      setProgress(70)

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as EnrichmentResult

        if (data.enriched_accounts && Array.isArray(data.enriched_accounts)) {
          setEnrichedAccounts(data.enriched_accounts)
          setProgress(100)
        } else {
          setError('Unexpected response format from enrichment service')
        }
      } else {
        setError(result.response.message || result.error || 'Failed to enrich accounts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during enrichment')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleClearList = () => {
    setManualInput('')
    setCsvFileName(null)
    setEnrichedAccounts([])
    setError(null)
    setProgress(0)
  }

  const handleExportCSV = () => {
    if (enrichedAccounts.length === 0) return

    const headers = ['Account Name', 'Domain', 'Industry', 'Business Context', 'Status', 'Contact Count']
    const rows = enrichedAccounts.map(account => [
      account.company_info?.company_name || account.account_id,
      account.account_id,
      account.company_info?.industry || '',
      account.company_info?.business_context || '',
      account.status || 'enriched',
      account.contact_profiles?.length || 0
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enriched-accounts-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportJSON = () => {
    if (enrichedAccounts.length === 0) return

    const json = JSON.stringify(enrichedAccounts, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enriched-accounts-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderBar />

      <div className="container mx-auto px-6 py-8">
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>CSV Upload</CardTitle>
              <CardDescription>Upload a CSV file with account names and domains</CardDescription>
            </CardHeader>
            <CardContent>
              <FileDropzone onFileSelect={handleFileSelect} disabled={loading} />
              {csvFileName && (
                <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {csvFileName}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter one account per line (e.g., "Salesforce (salesforce.com)")</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Salesforce (salesforce.com)&#10;HubSpot (hubspot.com)&#10;Stripe (stripe.com)"
                className="min-h-[180px] font-mono text-sm"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: Company Name (domain.com) or just domain.com
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  onClick={handleEnrichAccounts}
                  disabled={loading || !manualInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-4 w-4 mr-2" />
                      Enrich Accounts
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearList}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear List
                </Button>
              </div>

              {enrichedAccounts.length > 0 && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={handleExportJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                </div>
              )}
            </div>

            {progress > 0 && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">Processing accounts... {progress}%</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        {enrichedAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Enriched Accounts ({enrichedAccounts.length})</CardTitle>
              <CardDescription>
                Click on a row to expand and view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contacts</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedAccounts.map((account, index) => (
                      <AccountRow key={account.account_id} account={account} index={index} />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {enrichedAccounts.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Enriched Accounts Yet</h3>
              <p className="text-gray-600 mb-6">
                Upload a CSV file or enter account information manually to get started
              </p>
              <div className="flex justify-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Company Research</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>LinkedIn Profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Industry Analysis</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
