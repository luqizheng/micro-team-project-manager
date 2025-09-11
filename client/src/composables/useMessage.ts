import { message } from 'ant-design-vue';

export function useMessage() {
  const showSuccess = (content: string) => {
    message.success(content);
  };
  
  const showError = (content: string) => {
    message.error(content);
  };
  
  const showWarning = (content: string) => {
    message.warning(content);
  };
  
  const showInfo = (content: string) => {
    message.info(content);
  };
  
  const showLoading = (content: string) => {
    return message.loading(content, 0);
  };
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading
  };
}
