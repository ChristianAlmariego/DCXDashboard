import { useState, useCallback } from "react";
import { fetchStories } from "../api/ado";

export function useAdoData() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (pat, org, project, areaPath) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStories(pat, org, project, areaPath);
      setStories(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stories, loading, error, lastRefresh, load };
}
