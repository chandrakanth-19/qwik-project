import { useEffect, useRef, useState } from "react";

// Polls a fetch function every `interval` ms until `stopWhen(data)` returns true
export function usePolling(fetchFn, interval = 4000, stopWhen = () => false) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const timerRef = useRef(null);
  const stopped  = useRef(false);

  const poll = async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setLoading(false);
      if (stopWhen(result)) {
        stopped.current = true;
        clearInterval(timerRef.current);
      }
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    stopped.current = false;
    poll();
    timerRef.current = setInterval(() => {
      if (!stopped.current) poll();
    }, interval);
    return () => clearInterval(timerRef.current);
  }, []);

  return { data, loading, error };
}
