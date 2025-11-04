import { toast } from 'react-toastify';

// Toast configuration options
const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const notify = {
  success: (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
  },
  
  error: (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options });
  },
  
  info: (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options });
  },
  
  warning: (message, options = {}) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },
  
  loading: (message, options = {}) => {
    return toast.loading(message, { ...defaultOptions, ...options });
  },
  
  // Update a loading toast to success/error
  update: (toastId, type, message, options = {}) => {
    toast.update(toastId, {
      render: message,
      type: type,
      isLoading: false,
      ...defaultOptions,
      ...options
    });
  },
  
  // Dismiss a specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  
  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  }
};