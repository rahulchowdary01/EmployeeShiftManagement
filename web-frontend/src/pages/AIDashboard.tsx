import { useState, useEffect } from 'react'
import { api } from '../lib/api'

// ---------- Types & Helpers ----------
// These utilities normalise the sometimes-unstructured LLM responses into
// predictable data that the UI components can safely render.
type JsonRecord = Record<string, unknown>
type JsonValue = string | number | boolean | null | JsonRecord | JsonValue[]

type OptimisationState = {
  raw: any
  parsed: JsonRecord | null
} | null

type InsightsState = {
  raw: any
  parsed: JsonRecord | null
} | null

type WorkforceState = {
  raw: any
  parsed: JsonRecord | null
} | null

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const formatUnknown = (value: unknown) => {
  if (value == null) return 'No data returned.'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

const parseJsonString = (value: unknown): JsonRecord | null => {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

const toObject = (value: unknown): JsonRecord | null => {
  if (isRecord(value)) return value
  return parseJsonString(value)
}

const getValue = (obj: JsonRecord | undefined | null, key: string, fallback = 'N/A'): string => {
  if (!obj) return fallback
  const value = obj[key]
  if (value === undefined || value === null) return fallback
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return formatUnknown(value)
}

const ensureArray = (value: unknown): JsonValue[] => {
  if (Array.isArray(value)) return value as JsonValue[]
  return []
}

const ensureRecordArray = (value: unknown): JsonRecord[] => {
  if (Array.isArray(value)) return value.filter(isRecord) as JsonRecord[]
  if (isRecord(value)) return [value]
  return []
}

const ensureStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(item => formatUnknown(item))
  if (value === undefined || value === null) return []
  if (isRecord(value)) return Object.values(value).map(item => formatUnknown(item))
  return [formatUnknown(value)]
}

const objectValuesList = (value: unknown): string[] => {
  if (!isRecord(value)) return []
  return Object.keys(value)
    .sort()
    .map(key => formatUnknown(value[key]))
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

type CoverageGap = {
  date?: string
  shift_type?: string
}

// Lightweight display components shared across the three AI panels.
const InsightCard: React.FC<{ label: string; items: Array<{ title: string; detail: string }> }> = ({ label, items }) => (
  <div>
    <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>{label}</h4>
    <ul style={{ paddingLeft: 20, fontSize: 13 }}>
      {items.map((item, idx) => (
        <li key={`${label}-${idx}`}><strong>{item.title}:</strong> {item.detail}</li>
      ))}
    </ul>
  </div>
)

const RecommendationList: React.FC<{ items: JsonValue[] | string[] }> = ({ items }) => (
  <ul style={{ paddingLeft: 20, fontSize: 13 }}>
    {items.map((item, idx) => (
      <li key={`rec-${idx}`}>{formatUnknown(item)}</li>
    ))}
  </ul>
)

export default function AIDashboard() {
  const [optimizationResult, setOptimizationResult] = useState<OptimisationState>(null)
  const [insights, setInsights] = useState<InsightsState>(null)
  const [workforceAnalysis, setWorkforceAnalysis] = useState<WorkforceState>(null)
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [langchainInfo, setLangchainInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function getOptimization() {
    setLoading(true)
    try {
      const result = await api.ai.optimizeSchedule() as any
      const parsed = parseJsonString(result?.recommendations)
      setOptimizationResult({ raw: result, parsed })
    } catch (e: any) {
      console.error('Optimization failed:', e.message)
      setOptimizationResult({ raw: null, parsed: null })
    } finally {
      setLoading(false)
    }
  }

  async function getInsights() {
    setLoading(true)
    try {
      const result = await api.ai.getInsights() as any
      const parsed = parseJsonString(result?.insights)
      setInsights({ raw: result, parsed })
    } catch (e: any) {
      console.error('Insights failed:', e.message)
      setInsights({ raw: null, parsed: null })
    } finally {
      setLoading(false)
    }
  }

  async function chatWithAI() {
    if (!chatQuery.trim()) return
    
    setLoading(true)
    try {
      const result = await api.ai.chat(chatQuery) as any
      setChatResponse(result.response || result.error || 'No response')
      setChatQuery('')
    } catch (e: any) {
      setChatResponse(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function analyzeWorkforce() {
    setLoading(true)
    try {
      const result = await api.ai.analyzeWorkforce('comprehensive') as any
      const parsed = parseJsonString(result)
      setWorkforceAnalysis({ raw: result, parsed: parsed ?? (isRecord(result) ? result : null) })
    } catch (e: any) {
      console.error('Workforce analysis failed:', e.message)
      setWorkforceAnalysis({ raw: null, parsed: null })
    } finally {
      setLoading(false)
    }
  }

  async function getLangChainInfo() {
    try {
      const result = await api.ai.getLangChainInfo()
      setLangchainInfo(result)
    } catch (e: any) {
      console.error('LangChain info failed:', e.message)
    }
  }

  useEffect(() => {
    getLangChainInfo()
  }, [])

  // Break down LangChain metadata ahead of render so the JSX stays tidy.
  const langchainFeatures: string[] = Array.isArray(langchainInfo?.features)
    ? langchainInfo.features as string[]
    : []
  const langchainComponents: Array<[string, unknown]> =
    langchainInfo?.langchain_components && typeof langchainInfo.langchain_components === 'object'
      ? Object.entries(langchainInfo.langchain_components as Record<string, unknown>)
      : []

  const optimizationData = optimizationResult?.parsed
  const optimizationRaw = optimizationResult?.raw
    ? formatUnknown(optimizationResult.raw.recommendations ?? optimizationResult.raw)
    : 'No data returned.'

  const insightsData = insights?.parsed
  const insightsRaw = insights?.raw
    ? formatUnknown(insights.raw.insights ?? insights.raw)
    : 'No data returned.'

  const workforceData = workforceAnalysis?.parsed
  const workforceRaw = workforceAnalysis?.raw
    ? formatUnknown(workforceAnalysis.raw)
    : 'No data returned.'

  return (
    <div className="grid grid-2">
      <section className="panel">
        <h2 className="panel-title"><span className="title-accent">AI</span> · Optimization</h2>
        
        <div style={{ marginBottom: 20 }}>
          <button 
            className="btn btn-primary" 
            onClick={getOptimization}
            disabled={loading}
            style={{ marginRight: 10 }}
          >
            {loading ? 'Analyzing...' : '🤖 Optimize Schedule'}
          </button>
          
          <button 
            className="btn btn-outline" 
            onClick={getInsights}
            disabled={loading}
            style={{ marginRight: 10 }}
          >
            📊 Get Insights
          </button>

          <button 
            className="btn btn-outline" 
            onClick={analyzeWorkforce}
            disabled={loading}
          >
            🔍 Analyze Workforce
          </button>
        </div>

        {optimizationResult && (
          <div style={{ 
            background: 'var(--charcoal-light)', 
            padding: 20, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid var(--accent)'
          }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: 16, fontSize: 18 }}>📊 Schedule Optimization</h3>
            {(() => {
              if (!optimizationResult?.raw?.success || !optimizationData) {
                return <p style={{ fontSize: 13 }}>{optimizationRaw}</p>
              }

              const workloadAnalysis = toObject(optimizationData.workload_analysis)
              const shiftsPerEmployeeRecord = workloadAnalysis?.shifts_per_employee && isRecord(workloadAnalysis.shifts_per_employee)
                ? workloadAnalysis.shifts_per_employee as JsonRecord
                : null

              const perEmployeeNumbers = shiftsPerEmployeeRecord
                ? Object.values(shiftsPerEmployeeRecord)
                    .map(toNumber)
                    .filter((value): value is number => value !== null)
                : []

              const averageWorkload = toNumber(workloadAnalysis?.average_shifts_per_employee)
                ?? (perEmployeeNumbers.length ? perEmployeeNumbers.reduce((sum, value) => sum + value, 0) / perEmployeeNumbers.length : null)
              const maxWorkload = toNumber(workloadAnalysis?.max_shifts_per_employee)
                ?? (perEmployeeNumbers.length ? Math.max(...perEmployeeNumbers) : null)
              const minWorkload = toNumber(workloadAnalysis?.min_shifts_per_employee)
                ?? (perEmployeeNumbers.length ? Math.min(...perEmployeeNumbers) : null)

              const coverageRecords: CoverageGap[] = (() => {
                const gaps = toObject(optimizationData.coverage_gaps)
                if (!gaps) return []
                const list = ensureRecordArray(gaps.missing_shifts ?? gaps.unfilled_shifts)
                if (list.length) return list as CoverageGap[]
                return ensureStringArray(gaps.recommendations).map(item => ({ date: item }))
              })()

              const optimizationRecommendations = (() => {
                const recRecord = toObject(optimizationData.optimizations)
                if (recRecord) {
                  const values = objectValuesList(recRecord)
                  if (values.length) return values
                }
                return ensureStringArray(optimizationData.optimizations)
              })()

              const fairnessScore = getValue(optimizationData as JsonRecord, 'fairness_score', 'Not calculated')

              return (
                <div style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.6, display: 'grid', gap: 16 }}>
                  <InsightCard
                    label="⚖️ Workload Analysis"
                    items={[
                      { title: 'Average workload per employee', detail: averageWorkload !== null ? averageWorkload.toFixed(1) : '—' },
                      { title: 'Max workload', detail: maxWorkload !== null ? String(maxWorkload) : '—' },
                      { title: 'Min workload', detail: minWorkload !== null ? String(minWorkload) : '—' },
                    ]}
                  />

                  {shiftsPerEmployeeRecord && (
                    <InsightCard
                      label="Employee Workloads"
                      items={Object.entries(shiftsPerEmployeeRecord).map(([name, value]) => ({
                        title: name,
                        detail: `${formatUnknown(value)} shifts`,
                      }))}
                    />
                  )}

                  <div>
                    <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>🔍 Coverage Gaps</h4>
                    {coverageRecords.length > 0 ? (
                      <ul style={{ paddingLeft: 20 }}>
                        {coverageRecords.map((gap, i) => (
                          <li key={`gap-${i}`}>
                            {gap.date ?? 'Unscheduled shift'}
                            {gap.shift_type ? ` • ${gap.shift_type}` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>✅ No coverage gaps detected</p>
                    )}
                  </div>

                  {optimizationRecommendations.length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>💡 Recommendations</h4>
                      <RecommendationList items={optimizationRecommendations} />
                    </div>
                  )}

                  <InsightCard
                    label="⭐ Fairness Score"
                    items={[{ title: 'Score', detail: `${fairnessScore} out of 10` }]}
                  />
                </div>
              )
            })()}
          </div>
        )}

        {insights && (
          <div style={{ 
            background: 'var(--charcoal-light)', 
            padding: 20, 
            borderRadius: 8,
            border: '1px solid var(--accent-2)',
            marginBottom: 16
          }}>
            <h3 style={{ color: 'var(--accent-2)', marginBottom: 16, fontSize: 18 }}>📈 Business Insights</h3>
            {(() => {
              if (!insights?.raw?.success || !insightsData) {
                return <p style={{ fontSize: 13 }}>{insightsRaw}</p>
              }

              const peakAnalysis = toObject(insightsData.peak_analysis)
              const performancePatterns = toObject(insightsData.performance_patterns)
              const costOptimization = toObject(insightsData.cost_optimization)
              const predictions = toObject(insightsData.predictions)

              const peakItems = (() => {
                const peakHours = peakAnalysis && (toObject(peakAnalysis.peak_hours) ?? null)
                if (!peakHours) {
                  const fallbackList = ensureStringArray(peakAnalysis)
                  if (fallbackList.length) {
                    return fallbackList.map((detail, idx) => ({ title: `Peak ${idx + 1}`, detail }))
                  }
                  return [{ title: 'Summary', detail: 'Peak hours identified across shifts.' }]
                }

                if (
                  peakHours.start_time ||
                  peakHours.end_time ||
                  peakHours.shift_type ||
                  peakHours.date
                ) {
                  const range = [peakHours.start_time, peakHours.end_time].filter(Boolean).join(' – ')
                  const label = peakHours.shift_type ? `${peakHours.shift_type} shift` : 'Peak shift'
                  const detailParts = [peakHours.date, range].filter(Boolean)
                  return [
                    {
                      title: label,
                      detail: detailParts.length ? detailParts.join(' • ') : 'Not specified',
                    },
                  ]
                }

                return Object.entries(peakHours).map(([label, value]) => ({
                  title: `${label} shift`,
                  detail: ensureStringArray(value).join(', ') || formatUnknown(value),
                }))
              })()

              const performanceItems = (() => {
                if (!performancePatterns) return [{ title: 'Summary', detail: 'No performance patterns detected.' }]
                const rows: Array<{ title: string; detail: string }> = []
                Object.entries(performancePatterns).forEach(([employee, info]) => {
                  const record = toObject(info)
                  if (!record) return
                  const detail = [
                    `Total shifts: ${getValue(record, 'total_shifts', '—')}`,
                    `Avg duration: ${getValue(record, 'average_shift_duration', '—')}`,
                  ].join(' • ')
                  rows.push({ title: employee.replace(/_/g, ' '), detail })
                })
                return rows.length ? rows : [{ title: 'Summary', detail: 'No performance patterns detected.' }]
              })()

              const costItems = (() => {
                const items: string[] = []
                if (costOptimization) {
                  const distribution = toObject(costOptimization.shift_type_distribution)
                  if (distribution) {
                    items.push(
                      ...Object.entries(distribution).map(
                        ([type, count]) => `${type} shifts: ${formatUnknown(count)}`,
                      ),
                    )
                  }
                  items.push(...ensureStringArray(costOptimization.potential_savings))
                  items.push(...ensureStringArray(costOptimization.opportunities))
                  items.push(...ensureStringArray(costOptimization.recommendations))
                }
                return items.length ? items : ['No specific opportunities identified.']
              })()

              const predictionItems = (() => {
                if (!predictions) return ['No predictions available.']
                const list: string[] = []
                const nextPeak = toObject(predictions.next_peak_hours)
                if (nextPeak) {
                  const detailParts = [nextPeak.date, nextPeak.shift_type, `${nextPeak.start_time ?? ''}${nextPeak.end_time ? ` – ${nextPeak.end_time}` : ''}`]
                    .filter(Boolean)
                  list.push(`Next peak: ${detailParts.join(' • ')}`)
                }
                list.push(...ensureStringArray(predictions.recommendations))
                list.push(...ensureStringArray(predictions.recommended_action))
                return list.length ? list : ['No predictions available.']
              })()

              return (
                <div style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.6, display: 'grid', gap: 16 }}>
                  <InsightCard label="⏰ Peak Hours" items={peakItems} />
                  <InsightCard label="👥 Performance Patterns" items={performanceItems} />
                  <div>
                    <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>💰 Cost Optimization</h4>
                    <RecommendationList items={costItems} />
                  </div>
                  <div>
                    <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>🔮 Predictions</h4>
                    <RecommendationList items={predictionItems} />
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {workforceAnalysis && (
          <div style={{ 
            background: 'var(--charcoal-light)', 
            padding: 16, 
            borderRadius: 8,
            border: '1px solid var(--accent-3)'
          }}>
            <h3 style={{ color: 'var(--accent-3)', marginBottom: 12 }}>Workforce Analysis</h3>
            {(() => {
              const data = workforceData ?? parseJsonString(workforceAnalysis.raw)
              if (!data) return <p>{workforceRaw}</p>

              const summary = toObject(data.summary)
              const departments = ensureRecordArray(data.department_summary)
              const distribution = toObject(data.shift_type_distribution)
              const recommendations = ensureRecordArray(data.department_summary)
              const recommendationText = ensureStringArray(data.recommendations)

              return (
                <div style={{ display: 'grid', gap: 16, fontSize: 13 }}>
                  {summary && (
                    <InsightCard
                      label="Summary"
                      items={[
                        { title: 'Employees', detail: getValue(summary, 'employee_count') },
                        { title: 'Shifts', detail: getValue(summary, 'shift_count') },
                        { title: 'Assignments', detail: getValue(summary, 'assignment_count') },
                      ]}
                    />
                  )}

                  {departments.length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--accent-3)', marginBottom: 6 }}>Department Load</h4>
                      <ul style={{ paddingLeft: 20 }}>
                        {departments.map((dept, idx) => {
                          const entry = toObject(dept)
                          if (!entry) return null
                          return (
                            <li key={`dept-${idx}`}>
                              <strong>{getValue(entry, 'department')}</strong>: {getValue(entry, 'employee_count', '0')} employees, {getValue(entry, 'assignment_count', '0')} assignments ({getValue(entry, 'avg_assignments_per_employee', '0')} per employee)
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {distribution && (
                    <div>
                      <h4 style={{ color: 'var(--accent-3)', marginBottom: 6 }}>Shift Type Distribution</h4>
                      <ul style={{ paddingLeft: 20 }}>
                        {Object.entries(distribution).map(([type, count]) => (
                          <li key={`dist-${type}`}>{type}: {formatUnknown(count)}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {recommendationText.length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--accent-3)', marginBottom: 6 }}>Recommendations</h4>
                      <RecommendationList items={recommendationText} />
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </section>

      <section className="panel">
        <h2 className="panel-title"><span className="title-accent">AI</span> · Assistant</h2>
        
        <div className="field">
          <label>Ask AI about shift management</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              className="input" 
              placeholder="e.g., How can I improve shift coverage?"
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && chatWithAI()}
              style={{ flex: 1 }}
            />
            <button 
              className="btn btn-primary" 
              onClick={chatWithAI}
              disabled={loading || !chatQuery.trim()}
            >
              💬 Ask
            </button>
          </div>
        </div>

        {chatResponse && (
          <div style={{ 
            background: 'var(--charcoal-light)', 
            padding: 16, 
            borderRadius: 8,
            marginTop: 16,
            border: '1px solid var(--accent-3)'
          }}>
            <h3 style={{ color: 'var(--accent-3)', marginBottom: 12 }}>AI Response</h3>
            <div style={{ 
              color: 'var(--ink)', 
              fontSize: 14, 
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap'
            }}>
              {chatResponse}
            </div>
          </div>
        )}

        {langchainInfo && (
          <div style={{ 
            background: 'var(--charcoal-light)', 
            padding: 16, 
            borderRadius: 8,
            marginTop: 16,
            border: '1px solid var(--accent)'
          }}>
            <h3 style={{ color: 'var(--accent)', marginBottom: 12 }}>🔗 LangChain Integration</h3>
            <div style={{ fontSize: 12, color: 'var(--ink)' }}>
              <p><strong>Framework:</strong> {langchainInfo.framework} v{langchainInfo.version}</p>
              <p><strong>Features:</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
                {langchainFeatures.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <p><strong>Components:</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                {langchainComponents.map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {formatUnknown(value)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: 12, color: 'var(--ink-muted)' }}>
          <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>AI Features:</h4>
          <ul style={{ paddingLeft: 20 }}>
            <li>Schedule optimization recommendations</li>
            <li>Workload balance analysis</li>
            <li>Coverage gap identification</li>
            <li>Employee assignment suggestions</li>
            <li>Historical data insights</li>
            <li>Cost optimization opportunities</li>
            <li>Advanced workforce pattern analysis</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
