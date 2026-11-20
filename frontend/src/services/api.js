/**
 * Catch the Phish API Service
 *
 * Thin client for the FastAPI backend. Every result shown in the UI comes from the backend.
 * There are deliberately NO client-side substitutes: if the service cannot be reached the
 * call throws an ApiError, so the UI shows an honest error instead of an invented result.
 */

// In production the API URL must be provided at build time (VITE_API_URL). The localhost
// default is for `npm run dev` only and can never end up in a production bundle.
// Trim whitespace / BOM defensively: a stray invisible character would turn the URL into a relative path.
const CONFIGURED_API_URL = (import.meta.env.VITE_API_URL || '').replace(/^\uFEFF/, '').trim().replace(/\/+$/, '');
const API_BASE_URL = CONFIGURED_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '');

const UNREACHABLE_MESSAGE =
  'The analysis service could not be reached. If it has been idle it may be waking up — please try again in a minute.';
const NOT_CONFIGURED_MESSAGE = 'The analysis service is not configured for this deployment.';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function authHeaders() {
  const token = localStorage.getItem('catch_the_phish_token') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Performs a request against the backend and returns parsed JSON.
 * Throws ApiError (with the server's `detail` message when available) on any failure.
 */
async function request(path, { method = 'GET', json, body, auth = false, timeout = 30000 } = {}) {
  if (!API_BASE_URL) throw new ApiError(NOT_CONFIGURED_MESSAGE);

  const headers = {};
  if (json !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) Object.assign(headers, authHeaders());

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : body,
      signal: AbortSignal.timeout(timeout),
    });
  } catch {
    throw new ApiError(UNREACHABLE_MESSAGE);
  }

  if (!response.ok) {
    let detail = '';
    try {
      const data = await response.json();
      if (typeof data?.detail === 'string') {
        detail = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
        // FastAPI validation errors: show the first message without the "Value error, " prefix.
        detail = String(data.detail[0].msg).replace(/^Value error,\s*/i, '');
      }
    } catch {
      /* non-JSON error body */
    }
    if (response.status === 429) detail = detail || 'Too many requests. Please wait a moment and try again.';
    throw new ApiError(detail || `Request failed (${response.status}).`, response.status);
  }

  return response.json();
}

const SCAN_TIMEOUT = 60000; // generous: a sleeping free-tier backend needs time to wake up

export const api = {
  // ==================== URL SCANNING & HISTORY ====================
  scanUrl(url) {
    return request('/scan', { method: 'POST', json: { url }, timeout: SCAN_TIMEOUT });
  },

  /** Up to 25 links at once. Returns { total, succeeded, failed, items[] }. */
  scanBulk(urls) {
    return request('/scan/bulk', { method: 'POST', json: { urls }, timeout: 120000 });
  },

  /** label: 'phishing' (report) or 'safe' (false positive) for a scan the backend returned an id for. */
  sendFeedback(scanId, label, comment) {
    return request('/feedback', { method: 'POST', json: { scan_id: scanId, label, comment }, timeout: 20000 });
  },

  getHistory(search = '', classification = '', limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (classification) params.append('classification', classification);
    params.append('limit', limit);
    params.append('offset', offset);
    return request(`/history?${params.toString()}`);
  },

  getHistoryItem(id) {
    return request(`/history/${id}`);
  },

  deleteHistoryItem(id) {
    return request(`/history/${id}`, { method: 'DELETE', auth: true });
  },

  clearAllHistory() {
    return request('/history', { method: 'DELETE', auth: true });
  },

  // ==================== PHISH TRACE ====================
  traceInfrastructure(url) {
    return request('/phish-trace/analyze', { method: 'POST', json: { url }, timeout: SCAN_TIMEOUT });
  },

  getPhishTraceStats() {
    return request('/phish-trace/stats');
  },

  getPhishTraceHistory(search = '', reputation = '', limit = 20, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (reputation) params.append('reputation', reputation);
    params.append('limit', limit);
    params.append('offset', offset);
    return request(`/phish-trace/history?${params.toString()}`);
  },

  getPhishTraceItem(id) {
    return request(`/phish-trace/${id}`);
  },

  deletePhishTraceItem(id) {
    return request(`/phish-trace/${id}`, { method: 'DELETE', auth: true });
  },

  // ==================== AUTHENTICATION ====================
  getToken() {
    return localStorage.getItem('catch_the_phish_token') || '';
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('catch_the_phish_token', token);
    } else {
      localStorage.removeItem('catch_the_phish_token');
    }
  },

  getAuthHeaders() {
    return authHeaders();
  },

  async registerUser(email, password, fullName = '') {
    const data = await request('/auth/register', {
      method: 'POST',
      json: { email, password, full_name: fullName },
    });
    this.setToken(data.access_token);
    return data;
  },

  async loginUser(email, password) {
    const data = await request('/auth/login', { method: 'POST', json: { email, password } });
    this.setToken(data.access_token);
    return data;
  },

  /** Returns the signed-in user, or null when signed out / the session is no longer valid. */
  async getCurrentUser() {
    if (!this.getToken()) return null;
    try {
      return await request('/auth/me', { auth: true });
    } catch (err) {
      if (err.status === 401 || err.status === 404) this.setToken('');
      return null;
    }
  },

  logoutUser() {
    this.setToken('');
  },

  // ==================== MULTI-CHANNEL SCAM DETECTION ====================
  scanJob(text, companyName = '', claimedSalary = '') {
    return request('/scam/job', {
      method: 'POST',
      json: { text, company_name: companyName, claimed_salary: claimedSalary },
      auth: true,
      timeout: SCAN_TIMEOUT,
    });
  },

  scanInvestment(text) {
    return request('/scam/investment', { method: 'POST', json: { text }, auth: true, timeout: SCAN_TIMEOUT });
  },

  // ==================== QR CODE SCANNING ====================
  scanQr(file) {
    if (!(file instanceof File || file instanceof Blob)) {
      return Promise.reject(new ApiError('Please choose an image or PDF file to scan.'));
    }
    const formData = new FormData();
    formData.append('file', file, file.name || 'uploaded_qr.png');
    return request('/scan/qr', { method: 'POST', body: formData, auth: true, timeout: SCAN_TIMEOUT });
  },

  getScamHistory(search = '', analysisType = 'ALL', riskTier = 'ALL', limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (analysisType) params.append('analysis_type', analysisType);
    if (riskTier) params.append('risk_tier', riskTier);
    params.append('limit', limit);
    params.append('offset', offset);
    return request(`/scam/history?${params.toString()}`, { auth: true });
  },

  deleteScamHistoryItem(id) {
    return request(`/scam/history/${id}`, { method: 'DELETE', auth: true });
  },

  clearScamHistory() {
    return request('/scam/history', { method: 'DELETE', auth: true });
  },

  // ==================== SCAM AWARENESS ACADEMY ====================
  getAcademyModules() {
    return request('/academy/modules');
  },

  getAcademyQuiz() {
    return request('/academy/quiz');
  },

  submitAcademyQuiz(answers) {
    return request('/academy/quiz/submit', { method: 'POST', json: { answers }, auth: true });
  },

  // ==================== DASHBOARD, MODEL & HEALTH ====================
  getDashboardStats() {
    return request('/dashboard/stats');
  },

  getMLMetrics() {
    return request('/ml/metrics');
  },

  async checkHealth() {
    if (!API_BASE_URL) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
      return response.ok;
    } catch {
      return false;
    }
  },
};
