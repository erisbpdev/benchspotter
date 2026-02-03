import React from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * ErrorBoundary component catches JavaScript errors anywhere in its child
 * component tree and displays a fallback UI instead of crashing the whole app.
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 *
 * Or with custom fallback:
 * <ErrorBoundary fallback={<CustomErrorComponent />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo?.componentStack);

    this.setState({ errorInfo });

    // You could also send this to an error reporting service
    // errorReportingService.log({ error, errorInfo });
  }

  handleRetry = () => {
    // Reset the error state and try rendering the children again
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise use the default ErrorFallback component
      return <ErrorFallback error={error} onRetry={this.handleRetry} />;
    }

    return children;
  }
}

export default ErrorBoundary;
