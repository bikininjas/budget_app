'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';

interface DebugInfo {
  client: {
    hostname: string;
    protocol: string;
    fullUrl: string;
    isSSR: boolean;
  };
  api: {
    baseURL: string;
    fullURL: string;
  };
  backend?: {
    request: any;
    config: any;
    security: any;
  };
  errors?: string[];
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const info: DebugInfo = {
      client: {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        fullUrl: window.location.href,
        isSSR: false,
      },
      api: {
        baseURL: '',
        fullURL: '',
      },
      errors: [],
    };

    // Get API base URL (will trigger interceptor)
    api.get('/health').then((response) => {
      info.api.baseURL = response.config.baseURL || 'unknown';
      info.api.fullURL = response.config.url || 'unknown';
      
      // Fetch backend debug info
      return api.get('/debug/config');
    }).then((response) => {
      info.backend = response.data;
      setDebugInfo(info);
      setLoading(false);
    }).catch((error) => {
      info.errors?.push(error.message);
      setDebugInfo(info);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">🔍 Loading Debug Info...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔍 Debug Information</h1>
        
        {/* Client Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">📱 Client (Browser)</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Hostname:</strong> {debugInfo?.client.hostname}</div>
            <div><strong>Protocol:</strong> {debugInfo?.client.protocol}</div>
            <div><strong>Full URL:</strong> {debugInfo?.client.fullUrl}</div>
            <div className={debugInfo?.client.protocol === 'https:' ? 'text-green-600' : 'text-red-600'}>
              <strong>HTTPS:</strong> {debugInfo?.client.protocol === 'https:' ? '✅ YES' : '❌ NO'}
            </div>
          </div>
        </div>

        {/* API Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">🔌 API Client Config</h2>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>Base URL:</strong> {debugInfo?.api.baseURL}</div>
            <div><strong>Full URL:</strong> {debugInfo?.api.fullURL}</div>
            <div className={debugInfo?.api.baseURL?.startsWith('https') ? 'text-green-600' : 'text-red-600'}>
              <strong>HTTPS:</strong> {debugInfo?.api.baseURL?.startsWith('https') ? '✅ YES' : '❌ NO'}
            </div>
          </div>
        </div>

        {/* Backend Info */}
        {debugInfo?.backend && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600">🖥️ Backend (Received Request)</h2>
              <div className="space-y-2 font-mono text-sm">
                <div><strong>URL:</strong> {debugInfo.backend.request.url}</div>
                <div><strong>Scheme:</strong> {debugInfo.backend.request.scheme}</div>
                <div><strong>Host:</strong> {debugInfo.backend.request.host}</div>
                <div><strong>X-Forwarded-Proto:</strong> {debugInfo.backend.request.x_forwarded_proto || 'N/A'}</div>
                <div><strong>X-Forwarded-For:</strong> {debugInfo.backend.request.x_forwarded_for || 'N/A'}</div>
                <div><strong>Referer:</strong> {debugInfo.backend.request.referer || 'N/A'}</div>
                <div className={debugInfo.backend.request.x_forwarded_proto === 'https' ? 'text-green-600' : 'text-red-600'}>
                  <strong>HTTPS:</strong> {debugInfo.backend.request.x_forwarded_proto === 'https' ? '✅ YES' : '❌ NO'}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-orange-600">⚙️ Backend Config</h2>
              <div className="space-y-2 font-mono text-sm">
                <div><strong>CORS Origins:</strong> {debugInfo.backend.config.cors_origins}</div>
                <div><strong>Allowed IPs:</strong> {debugInfo.backend.config.allowed_ips || 'N/A'}</div>
                <div><strong>Allowed Referers:</strong> {debugInfo.backend.config.allowed_referers || 'N/A'}</div>
                <div><strong>Frontend URL:</strong> {debugInfo.backend.config.frontend_url}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-red-600">🔒 Security Headers</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="text-green-600">
                  <strong>HSTS:</strong> {debugInfo.backend.security.hsts_enabled ? '✅ Enabled' : '❌ Disabled'}
                </div>
                <div className="text-green-600">
                  <strong>HTTPS Only:</strong> {debugInfo.backend.security.https_only ? '✅ Enforced' : '❌ Not Enforced'}
                </div>
                <div className="text-green-600">
                  <strong>CSP (Mixed Content Block):</strong> {debugInfo.backend.security.csp_enabled ? '✅ Enabled' : '❌ Disabled'}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Errors */}
        {debugInfo?.errors && debugInfo.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">❌ Errors</h2>
            <div className="space-y-2 font-mono text-sm text-red-700">
              {debugInfo.errors.map((error, idx) => (
                <div key={idx}>{error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">📋 What to Check</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li><strong>All HTTPS should be ✅</strong> - If any is ❌, there's the problem!</li>
            <li><strong>Client Protocol:</strong> Should be https:// (not http://)</li>
            <li><strong>API Base URL:</strong> Should start with https://backend-budget.novacat.fr</li>
            <li><strong>X-Forwarded-Proto:</strong> Should be 'https' on backend</li>
            <li><strong>HSTS/CSP:</strong> Should be enabled to block mixed content</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-6 space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Refresh Debug Info
          </button>
          <button
            onClick={() => {
              if (window.confirm('Clear cache and reload?')) {
                window.location.reload();
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            🗑️ Clear Cache & Reload
          </button>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🏠 Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
