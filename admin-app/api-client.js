/**
 * ============================================================
 * NURSE MANAGEMENT SYSTEM — Shared API Client
 * File: api-client.js
 * Thin fetch() wrapper used by every page instead of localStorage.
 * Include this before any page-specific script that calls `api.*`.
 * ============================================================ */

'use strict';

const API_BASE_URL = 'https://nurse-care-system.onrender.com/api';

async function apiRequest(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    console.log('[API DEBUG] Requesting: ' + API_BASE_URL + path);
    response = await fetch(API_BASE_URL + path, options);
    console.log('[API DEBUG] Got response status: ' + response.status);
  } catch (err) {
    console.error('[API DEBUG] Fetch threw: ' + err.name + ' - ' + err.message);
    throw new Error('Cannot reach the server. Is the backend running on port 8080?');
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const message = (data && data.error) ? data.error : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  get: (path) => apiRequest('GET', path),
  post: (path, body) => apiRequest('POST', path, body),
  put: (path, body) => apiRequest('PUT', path, body),
  del: (path) => apiRequest('DELETE', path),
};
