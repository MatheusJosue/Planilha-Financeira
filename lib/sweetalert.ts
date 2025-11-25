import Swal from 'sweetalert2';

export const showSuccess = (message: string, title: string = 'Sucesso!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK'
  });
};

export const showError = (message: string, title: string = 'Erro!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK'
  });
};

export const showSuccessToast = (message: string) => {
  return Swal.fire({
    icon: 'success',
    title: message,
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const showErrorToast = (message: string) => {
  return Swal.fire({
    icon: 'error',
    title: message,
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const showWarning = (message: string, title: string = 'Atenção!') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK'
  });
};

export const showInfo = (message: string, title: string = 'Informação') => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'OK'
  });
};

export const showConfirm = (message: string, title: string = 'Confirmar?') => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#dc2626',
    confirmButtonText: 'Sim',
    cancelButtonText: 'Não'
  });
};
