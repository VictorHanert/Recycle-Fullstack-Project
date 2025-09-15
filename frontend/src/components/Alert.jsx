import { useEffect } from 'react';

function Alert({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'confirm', // 'confirm', 'info', 'error'
  showCancel = true
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          buttonText: 'text-white'
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          buttonColor: 'bg-blue-600 hover:bg-blue-700',
          buttonText: 'text-white'
        };
      case 'confirm':
      default:
        return {
          bgColor: 'bg-white',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          buttonColor: 'bg-red-600 hover:bg-red-700',
          buttonText: 'text-white'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative ${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-xl max-w-md w-full mx-4`}>
        <div className="p-6">
          {/* Title */}
          {title && (
            <h3 className={`text-lg font-semibold ${styles.titleColor} mb-3`}>
              {title}
            </h3>
          )}

          {/* Message */}
          <p className="text-gray-700 mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            {showCancel && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 ${styles.buttonColor} ${styles.buttonText} rounded-lg transition-colors`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alert;