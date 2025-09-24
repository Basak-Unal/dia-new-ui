import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HomeIcon } from '@heroicons/react/24/outline';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl text-primary-600">404</span>
        </div>
        <h1 className="text-3xl font-bold text-text mb-2">Page Not Found</h1>
        <p className="text-text-muted max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>
      </div>
      
      <div className="space-y-4">
        <Link to="/">
          <Button className="flex items-center space-x-2">
            <HomeIcon className="w-4 h-4" />
            <span>Back to Home</span>
          </Button>
        </Link>
        
        <p className="text-sm text-text-muted">
          If you think this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}