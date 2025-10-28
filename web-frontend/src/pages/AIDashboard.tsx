import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function AIDashboard() {
  const [optimizationResult, setOptimizationResult] = useState<any>(null)
  const [insights, setInsights] = useState<any>(null)
  const [chatQuery, setChatQuery] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [workforceAnalysis, setWorkforceAnalysis] = useState<any>(null)
  const [langchainInfo, setLangchainInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function getOptimization() {
    setLoading(true)
    try {
      const result = await api.ai.optimizeSchedule()
      setOptimizationResult(result)
    } catch (e: any) {
      console.error('Optimization failed:', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function getInsights() {
    setLoading(true)
    try {
      const result = await api.ai.getInsights()
      setInsights(result)
    } catch (e: any) {
      console.error('Insights failed:', e.message)
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
      const result = await api.ai.analyzeWorkforce('comprehensive')
      setWorkforceAnalysis(result)
    } catch (e: any) {
      console.error('Workforce analysis failed:', e.message)
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
            {optimizationResult.success && optimizationResult.recommendations ? (
              <div style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.6 }}>
                {(() => {
                  try {
                    const data = JSON.parse(optimizationResult.recommendations);
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>⚖️ Workload Analysis</h4>
                          <p>• Average workload per employee: <strong>{data.workload_analysis?.average_workload_per_employee || data.workload_analysis?.total_shifts_assigned || '2.0'}</strong></p>
                          <p>• Max workload: <strong>{data.workload_analysis?.max_workload_per_employee || '2'}</strong></p>
                          <p>• Min workload: <strong>{data.workload_analysis?.min_workload_per_employee || '0'}</strong></p>
                          {data.workload_analysis?.shifts_per_employee && (
                            <div style={{ marginTop: 8 }}>
                              <p><strong>Employee Workloads:</strong></p>
                              {Object.entries(data.workload_analysis.shifts_per_employee).map(([name, shifts]) => (
                                <p key={name} style={{ marginLeft: 16, fontSize: 13 }}>• {name}: {String(shifts)} shifts</p>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>🔍 Coverage Gaps</h4>
                          {data.coverage_gaps && data.coverage_gaps.length > 0 ? (
                            <ul style={{ paddingLeft: 20 }}>
                              {data.coverage_gaps.map((gap: any, i: number) => (
                                <li key={i}>• {gap.date} - {gap.shift_type}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>✅ No coverage gaps detected</p>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>💡 Recommendations</h4>
                          <p>{data.optimizations?.recommendations || 'No specific recommendations available'}</p>
                        </div>
                        
                        <div>
                          <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>⭐ Fairness Score</h4>
                          <p><strong>{data.fairness_score || 'Not calculated'}</strong> out of 10</p>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    // If JSON parsing fails, display the raw response
                    return (
                      <div>
                        <h4 style={{ color: 'var(--accent-2)', marginBottom: 8 }}>📊 AI Analysis</h4>
                        <div style={{ 
                          background: 'rgba(212, 175, 55, 0.1)', 
                          padding: 12, 
                          borderRadius: 6, 
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          whiteSpace: 'pre-wrap',
                          fontSize: 13
                        }}>
                          {optimizationResult.recommendations}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <p style={{ color: 'var(--danger)' }}>Failed to get optimization recommendations</p>
            )}
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
            {insights.success && insights.insights ? (
              <div style={{ color: 'var(--ink)', fontSize: 14, lineHeight: 1.6 }}>
                {(() => {
                  try {
                    const data = JSON.parse(insights.insights);
                    return (
                      <div>
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>⏰ Peak Hours Analysis</h4>
                          {data.peak_analysis?.peak_hours ? (
                            <div>
                              <p>• Peak Date: <strong>{data.peak_analysis.peak_hours.date || 'Not identified'}</strong></p>
                              <p>• Peak Time: <strong>{data.peak_analysis.peak_hours.start_time || '09:00'} - {data.peak_analysis.peak_hours.end_time || '17:00'}</strong></p>
                            </div>
                          ) : (
                            <div>
                              <p>• Morning Peak: <strong>{data.peak_analysis?.morning_peak || (data.peak_analysis?.morning ? `${data.peak_analysis.morning.start_time} - ${data.peak_analysis.morning.end_time}` : '8:00 AM - 5:00 PM')}</strong></p>
                              <p>• Night Peak: <strong>{data.peak_analysis?.night_peak || (data.peak_analysis?.night ? `${data.peak_analysis.night.start_time} - ${data.peak_analysis.night.end_time}` : '9:00 PM - 5:00 AM')}</strong></p>
                            </div>
                          )}
                          {data.peak_analysis?.off_peak_hours && (
                            <p>• Off-Peak: <strong>{data.peak_analysis.off_peak_hours.date} ({data.peak_analysis.off_peak_hours.start_time} - {data.peak_analysis.off_peak_hours.end_time})</strong></p>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>👥 Performance Patterns</h4>
                          {data.performance_patterns ? (
                            <div>
                              <p>• Employee ID: <strong>{data.performance_patterns.employee_id || 'Not analyzed'}</strong></p>
                              {data.performance_patterns.shift_type_analysis ? (
                                <div style={{ marginLeft: 16 }}>
                                  <p><strong>Shift Analysis:</strong></p>
                                  {Object.entries(data.performance_patterns.shift_type_analysis).map(([type, analysis]: [string, any]) => (
                                    <div key={type} style={{ marginLeft: 16 }}>
                                      <p>• {type}: <strong>{analysis.total_shifts || 0}</strong> shifts, Avg Duration: <strong>{analysis.average_duration || '8 hours'}</strong></p>
                                    </div>
                                  ))}
                                </div>
                              ) : data.performance_patterns.shift_type_performance ? (
                                <div style={{ marginLeft: 16 }}>
                                  <p>• Morning Shifts: <strong>{data.performance_patterns.shift_type_performance.MORNING?.on_time_percentage || data.performance_patterns.shift_type_performance.MORNING?.average_performance || 'No data'}</strong> performance</p>
                                  <p>• Night Shifts: <strong>{data.performance_patterns.shift_type_performance.NIGHT?.on_time_percentage || data.performance_patterns.shift_type_performance.NIGHT?.average_performance || 'No data'}</strong> performance</p>
                                </div>
                              ) : (
                                <p>• Analysis: <strong>Performance patterns identified</strong></p>
                              )}
                            </div>
                          ) : (
                            <p>• Analysis: <strong>No specific performance patterns detected</strong></p>
                          )}
                        </div>
                        
                        <div>
                          <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>💰 Cost Optimization</h4>
                          {data.cost_optimization?.potential_opportunities && Array.isArray(data.cost_optimization.potential_opportunities) ? (
                            <div>
                              <p><strong>Opportunities:</strong></p>
                              <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                                {data.cost_optimization.potential_opportunities.map((opportunity: string, index: number) => (
                                  <li key={index} style={{ marginBottom: 4 }}>• {opportunity}</li>
                                ))}
                              </ul>
                            </div>
                          ) : data.cost_optimization?.opportunities && Array.isArray(data.cost_optimization.opportunities) ? (
                            <ul style={{ paddingLeft: 20 }}>
                              {data.cost_optimization.opportunities.map((opportunity: string, i: number) => (
                                <li key={i}>• {opportunity}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{data.cost_optimization?.recommendations || data.cost_optimization?.opportunities || 'No specific cost optimization recommendations available'}</p>
                          )}
                        </div>
                        
                        <div>
                          <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>🔮 Predictions</h4>
                          <p>{data.predictions?.recommended_action || 'No predictions available'}</p>
                        </div>
                      </div>
                    );
                  } catch (e) {
                    // If JSON parsing fails, display the raw response
                    return (
                      <div>
                        <h4 style={{ color: 'var(--accent)', marginBottom: 8 }}>📈 AI Insights</h4>
                        <div style={{ 
                          background: 'rgba(52, 152, 219, 0.1)', 
                          padding: 12, 
                          borderRadius: 6, 
                          border: '1px solid rgba(52, 152, 219, 0.3)',
                          whiteSpace: 'pre-wrap',
                          fontSize: 13
                        }}>
                          {insights.insights}
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <p style={{ color: 'var(--danger)' }}>Failed to get business insights</p>
            )}
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
            <pre style={{ 
              color: 'var(--ink)', 
              fontSize: 12, 
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(workforceAnalysis, null, 2)}
            </pre>
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
                {langchainInfo.features.map((feature: string, i: number) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <p><strong>Components:</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                {Object.entries(langchainInfo.langchain_components).map(([key, value]) => (
                  <li key={key}><strong>{key}:</strong> {String(value)}</li>
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
