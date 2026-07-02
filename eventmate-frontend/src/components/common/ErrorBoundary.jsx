import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to an error reporting service if desired
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-6">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">
              An unexpected error occurred. Our team has been notified.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-xl p-4 mb-6 overflow-auto max-h-40 border border-red-200 dark:border-red-800">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition shadow-lg"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
