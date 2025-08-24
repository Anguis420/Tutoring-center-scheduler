import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">What would you like to do?</h3>
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
                <Link
                  to="/appointments"
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  View Appointments
                </Link>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
            </div>

            {/* Help Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-4">
                  If you believe this is an error, please contact our support team.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>• Check the URL for typos</p>
                  <p>• Use the navigation menu above</p>
                  <p>• Return to the dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Help Links */}
      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          <p>
            Still having trouble?{' '}
            <Link to="/" className="font-medium text-primary-600 hover:text-primary-500">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 