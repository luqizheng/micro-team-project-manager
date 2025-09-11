import { ref } from 'vue';

export function useLoading(initialValue = false) {
  const loading = ref(initialValue);
  
  const setLoading = (value: boolean) => {
    loading.value = value;
  };
  
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  };
  
  return {
    loading,
    setLoading,
    withLoading
  };
}
