import hotToast from "react-hot-toast";

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  dismiss: (id?: string) => hotToast.dismiss(id),
};
