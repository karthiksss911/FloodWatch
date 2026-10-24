import { useState, useEffect } from 'react';
import Icon from '../../../components/common/Icon';
import incidentService from '../../../services/incidentService';

export default function AiIncidentIntelligenceCard({
  incidentId,
  isAuthority = true,
  onAnalysisLoaded,
  className = '',
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Fetch existing analysis when incidentId changes
  useEffect(() => {
    let ignore = false;
    if (!incidentId) return;

    incidentService
      .getAiAnalysis(incidentId)
      .then((data) => {
        if (!ignore) {
          setAnalysis(data);
          setIsLoading(false);
          if (typeof onAnalysisLoaded === 'function') {
            onAnalysisLoaded(data);
          }
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.warn('[AiIncidentIntelligenceCard] Could not fetch saved analysis:', err.message);
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [incidentId, onAnalysisLoaded]);

  // Handle generation/re-analysis
  const handleTriggerAnalysis = async (force = false) => {
    if (!incidentId || isGenerating) return;

    // Check if an authority secret is present
    const currentSecret = incidentService.getAuthoritySecret();
    if (!currentSecret) {
      setShowAuthPrompt(true);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setShowAuthPrompt(false);

      const res = await incidentService.generateAiAnalysis(incidentId, {
        forceReanalyze: force,
      });

      setAnalysis(res.data);
      if (typeof onAnalysisLoaded === 'function') {
        onAnalysisLoaded(res.data);
      }
    } catch (err) {
      console.error('[AiIncidentIntelligenceCard] Analysis failed:', err);
      if (err.status === 403 || err.code === 'FORBIDDEN_AUTHORITY_REQUIRED') {
        setShowAuthPrompt(true);
        setAuthError('Invalid Authority Secret Key. Please re-enter the correct authority key.');
      } else if (err.status === 429) {
        setError('OpenAI rate limit exceeded. Please wait a few moments before retrying.');
      } else {
        setError(err.message || 'AI incident intelligence generation failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePasskeyAndRun = (e) => {
    e.preventDefault();
    if (!passkeyInput.trim()) {
      setAuthError('Please enter a valid authority key.');
      return;
    }
    setAuthError('');
    incidentService.setAuthoritySecret(passkeyInput.trim());
    handleTriggerAnalysis(Boolean(analysis));
  };

  const formatClassification = (type) => {
    if (!type || type === 'other') return 'General Flood Hazard';
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const getSeverityPill = (sev) => {
    const s = (sev || 'unknown').toLowerCase();
    let bg = 'rgba(100, 116, 139, 0.2)';
    let color = '#94A3B8';
    let border = 'rgba(148, 163, 184, 0.3)';

    if (s === 'critical') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#EF4444';
      border = 'rgba(239, 68, 68, 0.4)';
    } else if (s === 'high') {
      bg = 'rgba(249, 115, 22, 0.15)';
      color = '#F97316';
      border = 'rgba(249, 115, 22, 0.4)';
    } else if (s === 'moderate') {
      bg = 'rgba(245, 158, 11, 0.15)';
      color = '#F59E0B';
      border = 'rgba(245, 158, 11, 0.4)';
    } else if (s === 'low') {
      bg = 'rgba(16, 185, 129, 0.15)';
      color = '#10B981';
      border = 'rgba(16, 185, 129, 0.4)';
    }

    return (
      <span
        style={{
          background: bg,
          color,
          border: `1px solid ${border}`,
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {s} Severity
      </span>
    );
  };

  const getUrgencyPill = (urg) => {
    const u = (urg || 'unknown').toLowerCase();
    let bg = 'rgba(100, 116, 139, 0.2)';
    let color = '#94A3B8';

    if (u === 'emergency') {
      bg = 'rgba(220, 38, 38, 0.25)';
      color = '#FCA5A5';
    } else if (u === 'urgent') {
      bg = 'rgba(234, 88, 12, 0.25)';
      color = '#FDBA74';
    } else if (u === 'elevated') {
      bg = 'rgba(202, 138, 4, 0.25)';
      color = '#FDE047';
    } else if (u === 'routine') {
      bg = 'rgba(16, 185, 129, 0.2)';
      color = '#6EE7B7';
    }

    return (
      <span
        style={{
          background: bg,
          color,
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
        }}
      >
        {u} urgency
      </span>
    );
  };

  const getRoadStatusPill = (status) => {
    const s = (status || 'unknown').toLowerCase();
    let bg = 'rgba(100, 116, 139, 0.15)';
    let color = '#94A3B8';
    let text = 'Road Status: Unknown';

    if (s === 'blocked') {
      bg = 'rgba(239, 68, 68, 0.2)';
      color = '#F87171';
      text = 'Roadway Impassable / Blocked';
    } else if (s === 'partially_blocked') {
      bg = 'rgba(245, 158, 11, 0.2)';
      color = '#FBBF24';
      text = 'Partially Blocked / Caution';
    } else if (s === 'open') {
      bg = 'rgba(16, 185, 129, 0.2)';
      color = '#34D399';
      text = 'Roadway Open';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          background: bg,
          color,
          borderRadius: '4px',
          padding: '3px 9px',
          fontSize: '11.5px',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
        {text}
      </span>
    );
  };

  return (
    <div className={`fw-ai-intel-container ${className}`} style={{ minWidth: 0 }}>
      {/* Header Bar */}
      <div className="fw-ai-header">
        <div className="fw-ai-title-wrap">
          <div className="fw-ai-badge-icon">
            <Icon name="sparkles" size={16} color="#38BDF8" />
          </div>
          <div>
            <h4 className="fw-ai-heading">AI Incident Intelligence</h4>
            <span className="fw-ai-sub">Structured automated triage & hazard assessment</span>
          </div>
        </div>

        <div className="fw-ai-header-actions">
          {analysis && analysis.analysis_status === 'completed' && (
            <span className="fw-ai-cache-pill" title={`Analyzed by ${analysis.model_name}`}>
              <Icon name="check-circle" size={11} color="#34D399" />
              <span>Model: {analysis.model_name || 'OpenAI'}</span>
            </span>
          )}

          {isAuthority && (
            <button
              type="button"
              className="fw-ai-btn fw-ai-btn-primary"
              onClick={() => handleTriggerAnalysis(Boolean(analysis))}
              disabled={isGenerating || isLoading}
              title={analysis ? 'Regenerate fresh AI assessment' : 'Analyze incident with OpenAI'}
            >
              {isGenerating ? (
                <>
                  <span className="fw-ai-spinner" />
                  <span>Analyzing...</span>
                </>
              ) : analysis ? (
                <>
                  <Icon name="refresh" size={12} />
                  <span>Re-analyze</span>
                </>
              ) : (
                <>
                  <Icon name="sparkles" size={12} />
                  <span>Generate Intelligence</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Authority Passkey Prompt Form (Only shown if key needed) */}
      {showAuthPrompt && (
        <form onSubmit={handleSavePasskeyAndRun} className="fw-ai-auth-prompt-box">
          <div className="fw-ai-auth-prompt-head">
            <Icon name="lock" size={14} color="#F59E0B" />
            <strong>Authority Authentication Required</strong>
          </div>
          <p className="fw-ai-auth-prompt-desc">
            AI incident intelligence requires authorized authority credentials. Enter your Authority Secret to authenticate this session.
          </p>
          <div className="fw-ai-auth-input-row">
            <input
              type="password"
              className="fw-panel-input"
              placeholder="Enter Authority Secret..."
              value={passkeyInput}
              onChange={(e) => {
                setPasskeyInput(e.target.value);
                setAuthError('');
              }}
              style={{ flex: 1, minWidth: '180px' }}
              autoFocus
            />
            <button type="submit" className="fw-ai-btn fw-ai-btn-primary" disabled={isGenerating}>
              Authorize & Analyze
            </button>
            <button
              type="button"
              className="fw-ai-btn fw-ai-btn-secondary"
              onClick={() => setShowAuthPrompt(false)}
            >
              Cancel
            </button>
          </div>
          {authError && <span className="fw-ai-auth-error">{authError}</span>}
        </form>
      )}

      {/* Loading State */}
      {isLoading && !analysis && (
        <div className="fw-ai-loading-box">
          <span className="fw-ai-spinner" />
          <span>Retrieving incident intelligence...</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="fw-ai-error-box">
          <Icon name="alert-triangle" size={14} color="#EF4444" />
          <span>{error}</span>
          {isAuthority && (
            <button
              type="button"
              className="fw-ai-retry-link"
              onClick={() => handleTriggerAnalysis(false)}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty State: No analysis yet */}
      {!isLoading && !analysis && !error && !isGenerating && (
        <div className="fw-ai-empty-box">
          <Icon name="cpu" size={24} color="#64748B" />
          <p className="fw-ai-empty-title">No AI Intelligence Generated Yet</p>
          <p className="fw-ai-empty-desc">
            This incident has not yet been processed by the automated risk intelligence engine.
            {isAuthority
              ? ' Click "Generate Intelligence" above to evaluate severity, passability, and recommended actions.'
              : ' Official AI assessment pending authority triage review.'}
          </p>
        </div>
      )}

      {/* Generating State Overlay */}
      {isGenerating && (
        <div className="fw-ai-generating-box">
          <span className="fw-ai-spinner fw-spinner-large" />
          <div>
            <strong>Synthesizing Incident Intelligence...</strong>
            <p>Evaluating reported water depth, road status, and risk telemetry with OpenAI structured reasoning.</p>
          </div>
        </div>
      )}

      {/* Completed Analysis Presentation */}
      {analysis && analysis.analysis_status === 'completed' && !isGenerating && (
        <div className="fw-ai-content-box">
          {/* Status & Severity Pill Row */}
          <div className="fw-ai-pill-row">
            <span className="fw-ai-class-pill">
              <Icon name="activity" size={12} color="#38BDF8" />
              <span>{formatClassification(analysis.incident_type)}</span>
            </span>
            {getSeverityPill(analysis.ai_severity)}
            {getUrgencyPill(analysis.urgency)}
            {getRoadStatusPill(analysis.road_status)}
          </div>

          {/* Human Review Advisory Alert if flagged */}
          {analysis.needs_human_review && (
            <div className="fw-ai-human-review-alert">
              <Icon name="shield-alert" size={15} color="#F59E0B" />
              <div>
                <strong>Priority Human Review Required</strong>
                <p>This report indicates potential high inundation, road impassability, or safety risks requiring immediate on-ground verification.</p>
              </div>
            </div>
          )}

          {/* Factual Summary */}
          {analysis.summary && (
            <div className="fw-ai-section">
              <span className="fw-ai-lbl">Factual Summary</span>
              <p className="fw-ai-summary-text">{analysis.summary}</p>
            </div>
          )}

          {/* Evidence-Based Reasoning */}
          {Array.isArray(analysis.reasoning) && analysis.reasoning.length > 0 && (
            <div className="fw-ai-section">
              <span className="fw-ai-lbl">Model Reasoning & Observations</span>
              <ul className="fw-ai-reasoning-list">
                {analysis.reasoning.map((item, idx) => (
                  <li key={idx}>
                    <Icon name="check" size={11} color="#38BDF8" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Action */}
          {analysis.recommended_action && (
            <div className="fw-ai-section fw-ai-action-box">
              <div className="fw-ai-action-head">
                <Icon name="shield-check" size={13} color="#10B981" />
                <span className="fw-ai-lbl" style={{ margin: 0, color: '#10B981' }}>
                  Recommended Responder Action
                </span>
              </div>
              <p className="fw-ai-action-text">{analysis.recommended_action}</p>
            </div>
          )}

          {/* Confidence & Model Meta Footer */}
          <div className="fw-ai-footer-meta">
            <div className="fw-ai-confidence-wrap">
              <span className="fw-ai-lbl" style={{ margin: 0 }}>
                Confidence Estimate:
              </span>
              <div className="fw-ai-confidence-track">
                <div
                  className="fw-ai-confidence-fill"
                  style={{
                    width: `${Math.round((analysis.confidence ?? 0.5) * 100)}%`,
                  }}
                />
              </div>
              <span className="fw-ai-confidence-num">
                {Math.round((analysis.confidence ?? 0.5) * 100)}% (Estimated)
              </span>
            </div>

            <div className="fw-ai-timestamp">
              {analysis.analyzed_at && (
                <span>
                  Analyzed:{' '}
                  {new Date(analysis.analyzed_at).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Legal / Operational Notice */}
          <div className="fw-ai-disclaimer">
            <Icon name="info" size={11} color="#64748B" />
            <span>
              Advisory output based on user-submitted report telemetry. Does not replace official SDRF/NDRF verification or incident dispatch.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
