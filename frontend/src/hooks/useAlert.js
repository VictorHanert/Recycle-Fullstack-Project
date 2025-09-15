import { useState } from 'react';

export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: null
  });

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    showAlert(title, message, 'confirm', onConfirm);
  };

  const showError = (title, message) => {
    showAlert(title, message, 'error', null);
  };

  const showInfo = (title, message) => {
    showAlert(title, message, 'info', null);
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    alertState,
    showAlert,
    showConfirm,
    showError,
    showInfo,
    closeAlert
  };
};