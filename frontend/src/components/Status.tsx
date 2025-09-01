import { useState, useEffect } from 'react';
import api from '../api/client';

interface DatabaseStatus {
  name: string;
  status: string;
  url?: string;
  error?: string;
}

const Status = () => {
  const [statuses, setStatuses] = useState<DatabaseStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAllDatabases = async () => {
      setLoading(true);
      const databases = [
        { name: 'MySQL', endpoint: '/api/mysql/health' },
        { name: 'MongoDB', endpoint: '/api/mongodb/health' },
        { name: 'Neo4j', endpoint: '/api/neo4j/health' }
      ];

      const results: DatabaseStatus[] = [];

      for (const db of databases) {
        try {
          const response = await api.get(db.endpoint);
          results.push({
            name: db.name,
            status: response.data.status || 'healthy',
            url: response.data.url || 'unknown'
          });
        } catch (error) {
          results.push({
            name: db.name,
            status: 'error',
            error: `Failed to connect to ${db.name}`
          });
        }
      }

      setStatuses(results);
      setLoading(false);
    };

    checkAllDatabases();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Database Status
          </h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {statuses.map((db) => (
              <div key={db.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{db.name}</h4>
                  <div className={`flex-shrink-0 h-3 w-3 rounded-full ${
                    db.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-16">Status:</span>
                    <span className={`text-sm capitalize ${
                      db.status === 'healthy' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {db.status}
                    </span>
                  </div>
                  
                  {db.url && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-500 w-16">URL:</span>
                      <span className="text-sm text-gray-600 truncate">{db.url}</span>
                    </div>
                  )}
                  
                  {db.error && (
                    <div className="mt-2">
                      <span className="text-xs text-red-500">{db.error}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              All database connections are checked automatically. Green indicates healthy, red indicates connection issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;
