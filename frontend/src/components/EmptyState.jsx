import React from 'react';
import { Button } from './ui/Button';

/**
 * Reusable EmptyState component for displaying when lists have no data
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.icon - Lucide React icon component
 * @param {string} props.title - Main heading text
 * @param {string} props.description - Subtext/description
 * @param {string} [props.actionLabel] - Optional button text
 * @param {Function} [props.onAction] - Optional button click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      {/* Icon */}
      {Icon && (
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon size={40} className="text-gray-400 dark:text-gray-500" />
        </div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-6 text-gray-700 dark:text-gray-300 max-w-md">
        {description}
      </p>

      {/* Optional Action Button */}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
