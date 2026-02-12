import React, { createContext, useContext, useState, useCallback } from 'react';
import { Transition } from '@headlessui/react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export const useToast = () => useContext(ToastContext);

const toastTypes = {
  success: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-50',
    textColor: 'text-green-800',
    borderColor: 'border-green-400',
    iconColor: 'text-green-400',
  },
  error: {
    icon: XCircleIcon,
    bgColor: 'bg-red-50',
    textColor: 'text-red-800',
    borderColor: 'border-red-400',
    iconColor: 'text-red-400',
  },
  warning: {
    icon: ExclamationCircleIcon,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400',
    iconColor: 'text-yellow-400',
  },
  info: {
    icon: InformationCircleIcon,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-400',
  },
};

function Toast({ toast, onDismiss }) {
  const { icon: Icon, bgColor, textColor, borderColor, iconColor } = toastTypes[toast.type];

  return (
    <Transition
      show={true}
      appear={true}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div 
        className={`max-w-sm w-full ${bgColor} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border-l-4 ${borderColor}`}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${iconColor}`} aria-hidden="true" />
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              {toast.title && (
                <p className={`text-sm font-medium ${textColor}`}>
                  {toast.title}
                </p>
              )}
              <p className={`text-sm ${toast.title ? 'mt-1' : ''} ${textColor}`}>
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`${bgColor} rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                onClick={() => onDismiss(toast.id)}
                aria-label="Close notification"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now().toString() + Math.random().toString();
    const toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.duration || 5000,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const contextValue = {
    showToast: addToast,
    success: (message, options) => addToast(message, 'success', options),
    error: (message, options) => addToast(message, 'error', options),
    warning: (message, options) => addToast(message, 'warning', options),
    info: (message, options) => addToast(message, 'info', options),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Container */}
      <div 
        className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        aria-live="assertive"
      >
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export default ToastContext;
