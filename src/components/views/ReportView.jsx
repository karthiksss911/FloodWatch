import { useState } from 'react';
import Icon from '../common/Icon';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { CATEGORIES, DEMO_AREA } from '../../data/demoData';

/**
 * Community Incident Reporting View (Phase 1 Ready)
 * Form for citizens and volunteers to report waterlogging and blocked routes.
 */
export default function ReportView({ onIncidentSubmitted, onNavigate }) {
  const [formData, setFormData] = useState({
    category: 'waterlogging',
    title: '',
    location_label: '',
    latitude: '9.9816',
    longitude: '76.2999',
    severity: 'moderate',
    water_depth_cm: '30',
    passable_for: 'High clearance vehicles only',
    description: '',
    confirmed: false,
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState('');
  const [errors, setErrors] = useState({});

  const handleSimulateGPS = () => {
    // Generate realistic coordinate around Greater Kochi
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;
    setFormData((prev) => ({
      ...prev,
      latitude: (DEMO_AREA.center[0] + offsetLat).toFixed(4),
      longitude: (DEMO_AREA.center[1] + offsetLng).toFixed(4),
      location_label: prev.location_label || 'Near Marine Drive Walkway, Ernakulam (Demo GPS)',
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Incident title is required.';
    if (!formData.location_label.trim()) errs.location_label = 'Location or landmark is required.';
    if (!formData.latitude || isNaN(Number(formData.latitude))) errs.latitude = 'Valid latitude is required.';
    if (!formData.longitude || isNaN(Number(formData.longitude))) errs.longitude = 'Valid longitude is required.';
    if (!formData.description.trim()) errs.description = 'Please describe the water level and road condition.';
    if (!formData.confirmed) errs.confirmed = 'Please confirm that this is a simulated demo entry.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newId = `INC-DEMO-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedId(newId);
    setSubmittedSuccess(true);
    if (typeof onIncidentSubmitted === 'function') {
      onIncidentSubmitted({
        ...formData,
        id: newId,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        water_depth_cm: parseInt(formData.water_depth_cm, 10) || 25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        observed_at: new Date().toISOString(),
        source_type: 'community',
        verification_status: 'demo_unverified',
        confidence_score: 55,
        rainfall_value: 32.0,
        rainfall_source: 'Kochi Met Unit (Simulated Demo)',
        review_history: [],
      });
    }
  };

  return (
    <div className="fw-report-view">
      <div className="fw-report-layout">
        <div className="fw-report-form-col">
          <Card
            title="Submit Community Flood / Road Incident (Demo Simulator)"
            subtitle="Simulate reporting waterlogging or blocked routes in Greater Kochi for hackathon risk evaluation."
            icon={<Icon name="report" size={20} color="#06B6D4" />}
          >
            {submittedSuccess ? (
              <div className="fw-submission-success" role="alert" aria-live="polite">
                <div className="fw-success-icon-wrap">
                  <Icon name="check-circle" size={48} color="#10B981" />
                </div>
                <h3 className="fw-success-title">Report Added to Demonstration Feed</h3>
                <p className="fw-success-desc">
                  Your report has been logged with ID <strong>{submittedId || 'INC-DEMO-2026'}</strong>. It is now tagged as an <em>Unverified Citizen Report (Demo)</em> and instantly visible on the Incident Map and Authority Triage Queue.
                </p>
                <div className="fw-success-actions">
                  <Button
                    variant="primary"
                    icon="map"
                    onClick={() => {
                      if (typeof onNavigate === 'function') {
                        onNavigate('map', submittedId);
                      }
                    }}
                  >
                    View on Incident Map
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSubmittedSuccess(false);
                      setFormData({
                        category: 'waterlogging',
                        title: '',
                        location_label: '',
                        latitude: '9.9816',
                        longitude: '76.2999',
                        severity: 'moderate',
                        water_depth_cm: '30',
                        passable_for: 'High clearance vehicles only',
                        description: '',
                        confirmed: false,
                      });
                    }}
                  >
                    Submit Another Report
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="fw-form">
                {/* Category Selection */}
                <div className="fw-form-group">
                  <label className="fw-form-label" htmlFor="inc-category">
                    Incident Classification *
                  </label>
                  <select
                    id="inc-category"
                    className="fw-form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="fw-form-group">
                  <label className="fw-form-label" htmlFor="inc-title">
                    Brief Headline / Issue Summary *
                  </label>
                  <input
                    id="inc-title"
                    type="text"
                    className={`fw-form-input ${errors.title ? 'fw-input-error' : ''}`}
                    placeholder="e.g. Waterlogging under bridge, sedan cars stalled"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  {errors.title && <span className="fw-error-text">{errors.title}</span>}
                </div>

                {/* Location & GPS */}
                <div className="fw-form-group">
                  <div className="fw-label-row">
                    <label className="fw-form-label" htmlFor="inc-location">
                      Landmark / Road Name in Greater Kochi *
                    </label>
                    <button
                      type="button"
                      className="fw-gps-btn"
                      onClick={handleSimulateGPS}
                      title="Use simulated GPS device coordinates"
                    >
                      <Icon name="pin" size={13} />
                      Simulate GPS Location
                    </button>
                  </div>
                  <input
                    id="inc-location"
                    type="text"
                    className={`fw-form-input ${errors.location_label ? 'fw-input-error' : ''}`}
                    placeholder="e.g. MG Road, Near Shenoys Junction"
                    value={formData.location_label}
                    onChange={(e) => setFormData({ ...formData, location_label: e.target.value })}
                  />
                  {errors.location_label && (
                    <span className="fw-error-text">{errors.location_label}</span>
                  )}
                </div>

                {/* Coordinates Row */}
                <div className="fw-form-row">
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-lat">
                      Latitude
                    </label>
                    <input
                      id="inc-lat"
                      type="text"
                      className={`fw-form-input ${errors.latitude ? 'fw-input-error' : ''}`}
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-lng">
                      Longitude
                    </label>
                    <input
                      id="inc-lng"
                      type="text"
                      className={`fw-form-input ${errors.longitude ? 'fw-input-error' : ''}`}
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                {/* Severity Selection */}
                <div className="fw-form-group">
                  <label className="fw-form-label">Estimated Risk & Severity *</label>
                  <div className="fw-severity-selector">
                    {[
                      { id: 'low', label: 'Minor', sub: 'Passable with care' },
                      { id: 'moderate', label: 'Moderate', sub: 'Two-wheelers avoid' },
                      { id: 'high', label: 'High', sub: 'Cars stalling / >1.5ft' },
                      { id: 'severe', label: 'Severe', sub: 'Impassable / Road closed' },
                    ].map((sev) => (
                      <label
                        key={sev.id}
                        className={`fw-sev-card fw-sev-${sev.id} ${
                          formData.severity === sev.id ? 'fw-sev-selected' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="severity"
                          value={sev.id}
                          checked={formData.severity === sev.id}
                          onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                          className="fw-sr-only"
                        />
                        <span className="fw-sev-title">{sev.label}</span>
                        <span className="fw-sev-sub">{sev.sub}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Depth & Passability Row */}
                <div className="fw-form-row">
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-depth">
                      Estimated Water Depth (cm)
                    </label>
                    <input
                      id="inc-depth"
                      type="number"
                      min="5"
                      max="200"
                      className="fw-form-input"
                      value={formData.water_depth_cm}
                      onChange={(e) => setFormData({ ...formData, water_depth_cm: e.target.value })}
                    />
                  </div>
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-passable">
                      Passable Vehicles
                    </label>
                    <input
                      id="inc-passable"
                      type="text"
                      className="fw-form-input"
                      placeholder="e.g. Buses only / Impassable"
                      value={formData.passable_for}
                      onChange={(e) => setFormData({ ...formData, passable_for: e.target.value })}
                    />
                  </div>
                </div>

                {/* Detailed Description */}
                <div className="fw-form-group">
                  <label className="fw-form-label" htmlFor="inc-desc">
                    Field Description & Visual Landmarks *
                  </label>
                  <textarea
                    id="inc-desc"
                    rows="3"
                    className={`fw-form-textarea ${errors.description ? 'fw-input-error' : ''}`}
                    placeholder="Describe stagnant water depth, traffic flow, submerged drainage grates, or stranded vehicles..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && (
                    <span className="fw-error-text">{errors.description}</span>
                  )}
                </div>

                {/* Photo Upload Attachment Simulation */}
                <div className="fw-form-group">
                  <label className="fw-form-label">Photo Evidence (Optional)</label>
                  <div className="fw-upload-dropzone">
                    <Icon name="layers" size={24} color="#64748B" />
                    <span>Click or drag image to attach field photo</span>
                    <span className="fw-upload-note">Max 5MB • JPG, PNG (Simulated attachment)</span>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="fw-form-group">
                  <label className="fw-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.confirmed}
                      onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                    />
                    <span>
                      I certify that this report reflects a genuine observation to the best of my knowledge. I understand this will be shared with the community as an unverified report.
                    </span>
                  </label>
                  {errors.confirmed && <span className="fw-error-text">{errors.confirmed}</span>}
                </div>

                <div className="fw-form-actions">
                  <Button type="submit" variant="primary" size="lg" icon="report">
                    Submit Incident Report
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Safety Guidelines Sidebar */}
        <div className="fw-report-guide-col">
          <Card
            title="Citizen Reporting Standards"
            subtitle="Maintaining credibility in emergency intelligence"
            icon={<Icon name="shield" size={18} color="#06B6D4" />}
          >
            <div className="fw-guide-box">
              <h4 className="fw-guide-title">
                <Icon name="check-circle" size={14} color="#10B981" />
                What to Include:
              </h4>
              <ul className="fw-guide-list">
                <li>Specific metro pillar numbers, road junctions, or bridges.</li>
                <li>Clear depth references (e.g. tyre rim level, knee level).</li>
                <li>Passability for two-wheelers vs emergency vehicles.</li>
              </ul>

              <h4 className="fw-guide-title fw-guide-warn">
                <Icon name="warning" size={14} color="#EF4444" />
                Never Risk Your Safety:
              </h4>
              <ul className="fw-guide-list">
                <li>Never step into fast-flowing water to measure depth.</li>
                <li>Avoid touching metal railings, poles, or submerged cables.</li>
                <li>For life-saving rescue, call <strong>112</strong> immediately.</li>
              </ul>
            </div>
          </Card>

          <Card
            title="Verification Workflow"
            subtitle="How your report is processed"
            icon={<Icon name="activity" size={18} color="#38BDF8" />}
          >
            <div className="fw-workflow-steps">
              <div className="fw-step-item">
                <Badge verification="unverified" />
                <p>Report enters the community live feed with an unverified citizen tag.</p>
              </div>
              <div className="fw-step-item">
                <Badge verification="community_confirmed" />
                <p>2+ independent reports from the same radius upgrade status to community confirmed.</p>
              </div>
              <div className="fw-step-item">
                <Badge verification="authority_verified" />
                <p>Municipal ward officers or traffic police verify and trigger emergency clearing.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
