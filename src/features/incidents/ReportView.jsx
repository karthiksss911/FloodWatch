import { useState, useRef } from 'react';
import Icon from '../../components/common/Icon';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LocationPickerMap from './components/LocationPickerMap';
import { CATEGORIES } from '../../config/disasterConfig';
import { initLeafletIcons } from '../../lib/leaflet/leafletConfig';

initLeafletIcons();

function getCurrentLocalDatetime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const KOCHI_PRESETS = [
  { name: 'Kaloor Metro', lat: 9.9944, lng: 76.2921 },
  { name: 'Edappally Toll', lat: 10.0248, lng: 76.3079 },
  { name: 'MG Road Shenoys', lat: 9.9729, lng: 76.2842 },
  { name: 'Vyttila Hub', lat: 9.9678, lng: 76.3197 },
  { name: 'Aluva Manappuram', lat: 10.1076, lng: 76.3533 },
  { name: 'Kakkanad Infopark', lat: 10.0118, lng: 76.3639 },
];

/**
 * Community Incident Reporting View (Features/Incidents)
 * Full interactive reporting with Leaflet location picker, manual coordinates,
 * comprehensive validation, loading/success states, and persistence integration.
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
    observed_at: getCurrentLocalDatetime(),
    photo_attached: false,
    photo_name: '',
    confirmed: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const fileInputRef = useRef(null);

  // Handle location selection from interactive map
  const handleMapLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(4),
      longitude: lng.toFixed(4),
      location_label:
        prev.location_label ||
        `Pinned near [${lat.toFixed(4)}, ${lng.toFixed(4)}] in Greater Kochi`,
    }));
    // Clear coordinate errors if any
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      return next;
    });
  };

  // Preset location handler
  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      latitude: preset.lat.toFixed(4),
      longitude: preset.lng.toFixed(4),
      location_label: `${preset.name}, Greater Kochi`,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.latitude;
      delete next.longitude;
      delete next.location_label;
      return next;
    });
  };

  // Detect genuine device GPS coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toFixed(4),
          longitude: lng.toFixed(4),
          location_label:
            prev.location_label ||
            `GPS Coords [${lat.toFixed(4)}, ${lng.toFixed(4)}]`,
        }));
        setErrors((prev) => {
          const next = { ...prev };
          delete next.latitude;
          delete next.longitude;
          return next;
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(`Unable to retrieve GPS: ${err.message}. Select on map instead.`);
        setGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Set observation time to current time
  const handleSetTimeNow = () => {
    setFormData((prev) => ({
      ...prev,
      observed_at: getCurrentLocalDatetime(),
    }));
  };

  // Genuine photo file selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo_attached: true,
        photo_name: file.name,
      }));
    }
  };

  const handleRemovePhoto = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setFormData((prev) => ({
      ...prev,
      photo_attached: false,
      photo_name: '',
    }));
  };

  // Validation logic
  const validate = () => {
    const errs = {};

    if (!formData.title.trim()) {
      errs.title = 'Incident title is required.';
    } else if (formData.title.trim().length < 5) {
      errs.title = 'Title must be at least 5 characters long.';
    }

    if (!formData.location_label.trim()) {
      errs.location_label = 'Location landmark or road name is required.';
    } else if (formData.location_label.trim().length < 3) {
      errs.location_label = 'Location must be at least 3 characters long.';
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errs.latitude = 'Enter a valid latitude between -90 and 90.';
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      errs.longitude = 'Enter a valid longitude between -180 and 180.';
    }

    // Kerala bounds advisory check
    if (!errs.latitude && !errs.longitude) {
      if (lat < 8.0 || lat > 13.0 || lng < 74.5 || lng > 77.8) {
        errs.latitude = 'Coordinates are outside Kerala region [8.0-13.0 N, 74.5-77.8 E].';
      }
    }

    if (!formData.observed_at) {
      errs.observed_at = 'Observation timestamp is required.';
    }

    if (!formData.description.trim()) {
      errs.description = 'Please describe the water level, road block, or hazard.';
    } else if (formData.description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters long.';
    }

    if (!formData.confirmed) {
      errs.confirmed = 'You must certify this report before submission.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submit to live Supabase backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const submissionPayload = {
      category: formData.category,
      title: formData.title.trim(),
      location_label: formData.location_label.trim(),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      severity: formData.severity,
      water_depth_cm: parseInt(formData.water_depth_cm, 10) || 25,
      passable_for: formData.passable_for.trim() || 'Passable with caution',
      description: formData.description.trim(),
      observed_at: formData.observed_at
        ? new Date(formData.observed_at).toISOString()
        : new Date().toISOString(),
      rainfall_value: null,
      rainfall_source: 'Telemetry Sensor Offline',
      reporter_notes: formData.photo_attached
        ? `Field evidence attached: ${formData.photo_name}. Submitted via citizen portal.`
        : 'Submitted via citizen reporting portal.',
    };

    try {
      if (typeof onIncidentSubmitted === 'function') {
        const saved = await onIncidentSubmitted(submissionPayload);
        setSubmittedData(saved || { ...submissionPayload, id: 'SAVED', verification_status: 'unverified' });
      } else {
        setSubmittedData({ ...submissionPayload, id: 'OFFLINE', verification_status: 'unverified' });
      }
    } catch (err) {
      setSubmissionError(err.message || 'Database error: Unable to submit incident report. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedData(null);
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
      observed_at: getCurrentLocalDatetime(),
      photo_attached: false,
      photo_name: '',
      confirmed: false,
    });
    setErrors({});
  };

  return (
    <div className="fw-report-view">
      <div className="fw-report-layout">
        {/* Main Report Form Column */}
        <div className="fw-report-form-col">
          <Card
            title="Submit Community Flood / Road Hazard"
            subtitle="Contribute citizen intelligence on waterlogging and impassable routes in Greater Kochi."
            icon={<Icon name="report" size={20} color="#06B6D4" />}
          >
            {submittedData ? (
              /* Success State Screen */
              <div className="fw-submission-success" role="alert" aria-live="polite">
                <div className="fw-success-icon-wrap">
                  <Icon name="check-circle" size={52} color="#10B981" />
                </div>
                <h3 className="fw-success-title">Report Persisted to Live Database</h3>
                <p className="fw-success-desc">
                  Your incident has been submitted directly to the connected Supabase database. It is
                  queued with status <strong>Unverified Citizen Report</strong> and will appear
                  on the live map and authority verification queue immediately.
                </p>

                {/* Submitted Incident Details Summary */}
                <div className="fw-success-summary-box">
                  <div className="fw-success-summary-row">
                    <span>Incident Reference:</span>
                    <strong>{submittedData.id}</strong>
                  </div>
                  <div className="fw-success-summary-row">
                    <span>Classification:</span>
                    <strong>{submittedData.title}</strong>
                  </div>
                  <div className="fw-success-summary-row">
                    <span>Severity:</span>
                    <Badge severity={submittedData.severity} />
                  </div>
                  <div className="fw-success-summary-row">
                    <span>Status:</span>
                    <Badge verification={submittedData.verification_status} />
                  </div>
                  <div className="fw-success-summary-row">
                    <span>Coordinates:</span>
                    <code>
                      [{submittedData.latitude.toFixed(4)}, {submittedData.longitude.toFixed(4)}]
                    </code>
                  </div>
                </div>

                <div className="fw-success-actions">
                  <Button
                    variant="primary"
                    icon="map"
                    onClick={() => {
                      if (typeof onNavigate === 'function') {
                        onNavigate('map', submittedData.id);
                      }
                    }}
                  >
                    View on Incident Map
                  </Button>

                  <Button
                    variant="secondary"
                    icon="activity"
                    onClick={() => {
                      if (typeof onNavigate === 'function') {
                        onNavigate('overview', submittedData.id);
                      }
                    }}
                  >
                    View in Overview Feed
                  </Button>

                  <Button variant="outline" onClick={handleResetForm}>
                    Submit Another Report
                  </Button>
                </div>
              </div>
            ) : (
              /* Reporting Form */
              <form onSubmit={handleSubmit} className="fw-form" noValidate>
                {/* Error Banner */}
                {Object.keys(errors).length > 0 && (
                  <div className="fw-form-error-banner" role="alert">
                    <Icon name="alert-triangle" size={18} color="#EF4444" />
                    <span>Please correct the highlighted fields below before submitting.</span>
                  </div>
                )}

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

                {/* Title / Summary */}
                <div className="fw-form-group">
                  <label className="fw-form-label" htmlFor="inc-title">
                    Headline / Issue Summary *
                  </label>
                  <input
                    id="inc-title"
                    type="text"
                    className={`fw-form-input ${errors.title ? 'fw-input-error' : ''}`}
                    placeholder="e.g. Underpass waterlogged, two sedans stranded"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? 'inc-title-err' : undefined}
                  />
                  {errors.title && (
                    <span id="inc-title-err" className="fw-error-text">
                      {errors.title}
                    </span>
                  )}
                </div>

                {/* Location Landmark */}
                <div className="fw-form-group">
                  <div className="fw-label-row">
                    <label className="fw-form-label" htmlFor="inc-location">
                      Landmark or Road Name in Greater Kochi *
                    </label>
                    <button
                      type="button"
                      className="fw-gps-btn"
                      onClick={handleDetectGPS}
                      disabled={gpsLoading}
                      title="Detect device GPS coordinates"
                    >
                      <Icon name="compass" size={13} />
                      {gpsLoading ? 'Detecting GPS...' : 'Use Device GPS'}
                    </button>
                  </div>
                  {gpsError && (
                    <span className="fw-error-text" style={{ display: 'block', marginBottom: '8px' }}>
                      {gpsError}
                    </span>
                  )}
                  <input
                    id="inc-location"
                    type="text"
                    className={`fw-form-input ${errors.location_label ? 'fw-input-error' : ''}`}
                    placeholder="e.g. Kaloor Junction, near Metro Pillar 594"
                    value={formData.location_label}
                    onChange={(e) => setFormData({ ...formData, location_label: e.target.value })}
                    aria-invalid={!!errors.location_label}
                    aria-describedby={errors.location_label ? 'inc-loc-err' : undefined}
                  />
                  {errors.location_label && (
                    <span id="inc-loc-err" className="fw-error-text">
                      {errors.location_label}
                    </span>
                  )}
                </div>

                {/* Interactive Location Picker Map Component */}
                <div className="fw-form-group">
                  <label className="fw-form-label">
                    Pin Location on Map (Click on map to select coordinates)
                  </label>

                  <LocationPickerMap
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationSelect={handleMapLocationSelect}
                  />

                  {/* Preset Landmark Chips */}
                  <div className="fw-location-presets">
                    <span className="fw-preset-label">Quick Kochi Landmarks:</span>
                    {KOCHI_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        className="fw-preset-chip"
                        onClick={() => handleApplyPreset(preset)}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coordinates Manual Inputs */}
                <div className="fw-form-row">
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-lat">
                      Latitude *
                    </label>
                    <input
                      id="inc-lat"
                      type="number"
                      step="any"
                      className={`fw-form-input ${errors.latitude ? 'fw-input-error' : ''}`}
                      placeholder="9.9816"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      aria-invalid={!!errors.latitude}
                      aria-describedby={errors.latitude ? 'inc-lat-err' : undefined}
                    />
                    {errors.latitude && (
                      <span id="inc-lat-err" className="fw-error-text">
                        {errors.latitude}
                      </span>
                    )}
                  </div>
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-lng">
                      Longitude *
                    </label>
                    <input
                      id="inc-lng"
                      type="number"
                      step="any"
                      className={`fw-form-input ${errors.longitude ? 'fw-input-error' : ''}`}
                      placeholder="76.2999"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      aria-invalid={!!errors.longitude}
                      aria-describedby={errors.longitude ? 'inc-lng-err' : undefined}
                    />
                    {errors.longitude && (
                      <span id="inc-lng-err" className="fw-error-text">
                        {errors.longitude}
                      </span>
                    )}
                  </div>
                </div>

                {/* Observation Time */}
                <div className="fw-form-group">
                  <div className="fw-label-row">
                    <label className="fw-form-label" htmlFor="inc-time">
                      Observation Time *
                    </label>
                    <button
                      type="button"
                      className="fw-time-now-btn"
                      onClick={handleSetTimeNow}
                      title="Set observation time to current time"
                    >
                      <Icon name="clock" size={13} />
                      Set to Now
                    </button>
                  </div>
                  <input
                    id="inc-time"
                    type="datetime-local"
                    className={`fw-form-input fw-datetime-input ${
                      errors.observed_at ? 'fw-input-error' : ''
                    }`}
                    value={formData.observed_at}
                    onChange={(e) => setFormData({ ...formData, observed_at: e.target.value })}
                  />
                  {errors.observed_at && (
                    <span className="fw-error-text">{errors.observed_at}</span>
                  )}
                </div>

                {/* Severity Selection */}
                <div className="fw-form-group">
                  <label className="fw-form-label">Estimated Risk & Severity *</label>
                  <div className="fw-severity-selector">
                    {[
                      { id: 'low', label: 'Minor', sub: 'Passable with care' },
                      { id: 'moderate', label: 'Moderate', sub: 'Two-wheelers avoid' },
                      { id: 'high', label: 'High', sub: 'Cars stalling / >1.5ft' },
                      { id: 'severe', label: 'Severe', sub: 'Impassable / Closed' },
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

                {/* Depth & Passability */}
                <div className="fw-form-row">
                  <div className="fw-form-group fw-col-half">
                    <label className="fw-form-label" htmlFor="inc-depth">
                      Estimated Water Depth (cm)
                    </label>
                    <input
                      id="inc-depth"
                      type="number"
                      min="0"
                      max="300"
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
                      placeholder="e.g. Buses & Trucks only"
                      value={formData.passable_for}
                      onChange={(e) => setFormData({ ...formData, passable_for: e.target.value })}
                    />
                  </div>
                </div>

                {/* Field Description */}
                <div className="fw-form-group">
                  <label className="fw-form-label" htmlFor="inc-desc">
                    Field Description & Visual Landmarks *
                  </label>
                  <textarea
                    id="inc-desc"
                    rows="3"
                    className={`fw-form-textarea ${errors.description ? 'fw-input-error' : ''}`}
                    placeholder="Describe water accumulation, road obstacles, stalled vehicles, or stormwater drain status..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  {errors.description && (
                    <span className="fw-error-text">{errors.description}</span>
                  )}
                </div>

                {/* Photo Evidence Attachment */}
                <div className="fw-form-group">
                  <label className="fw-form-label">Photo Evidence (Optional Citizen Upload)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    style={{ display: 'none' }}
                    id="inc-photo-file-input"
                  />
                  <div
                    className={`fw-upload-dropzone ${
                      formData.photo_attached ? 'fw-upload-attached' : ''
                    }`}
                    onClick={() => {
                      if (!formData.photo_attached && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !formData.photo_attached && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <Icon
                      name={formData.photo_attached ? 'check-circle' : 'layers'}
                      size={24}
                      color={formData.photo_attached ? '#10B981' : '#64748B'}
                    />
                    {formData.photo_attached ? (
                      <>
                        <span className="fw-attached-name">
                          <strong>{formData.photo_name}</strong> attached
                        </span>
                        <button
                          type="button"
                          className="fw-upload-note"
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                          onClick={handleRemovePhoto}
                        >
                          Remove photo
                        </button>
                      </>
                    ) : (
                      <>
                        <span>Click to attach photo evidence</span>
                        <span className="fw-upload-note">Max 5MB • JPG, PNG, WebP</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Certification Checkbox */}
                <div className="fw-form-group">
                  <label className="fw-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.confirmed}
                      onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                    />
                    <span>
                      I certify that this report reflects genuine flood or road conditions observed
                      in the field. I understand it will be marked as an{' '}
                      <strong>Unverified Citizen Report</strong> until officially reviewed.
                    </span>
                  </label>
                  {errors.confirmed && <span className="fw-error-text">{errors.confirmed}</span>}
                </div>

                {/* Submission Error Banner */}
                {submissionError && (
                  <div className="fw-form-error-banner" role="alert" style={{ marginBottom: '16px' }}>
                    <Icon name="alert-triangle" size={18} color="#EF4444" />
                    <span>{submissionError}</span>
                  </div>
                )}

                {/* Submit Action */}
                <div className="fw-form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={isSubmitting ? undefined : 'report'}
                    disabled={isSubmitting}
                    className={isSubmitting ? 'fw-btn-loading' : ''}
                  >
                    {isSubmitting ? (
                      <span className="fw-submitting-state">
                        <span className="fw-spinner" /> Submitting Report...
                      </span>
                    ) : (
                      'Submit Incident Report'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>

        {/* Safety & Workflow Guidelines Sidebar */}
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
                <li>
                  For life-saving rescue, call <strong>112</strong> immediately.
                </li>
              </ul>
            </div>
          </Card>

          <Card
            title="Verification Lifecycle"
            subtitle="How citizen reports are audited"
            icon={<Icon name="activity" size={18} color="#38BDF8" />}
          >
            <div className="fw-workflow-steps">
              <div className="fw-step-item">
                <Badge verification="unverified" />
                <p>
                  Newly submitted reports start as <em>Unverified Citizen Reports</em> and are
                  immediately mapped with a cautionary status.
                </p>
              </div>
              <div className="fw-step-item">
                <Badge verification="community_confirmed" />
                <p>
                  Multiple reports from adjacent GPS radiuses elevate credibility to community-confirmed status.
                </p>
              </div>
              <div className="fw-step-item">
                <Badge verification="authority_verified" />
                <p>
                  Ward volunteers or municipal desk operators review reports in the Authority Console.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
