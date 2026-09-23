import { useState, useCallback } from "react";
import { fetchStories, fetchFeatures } from "../api/ado";

export function useAdoData() {
  const [stories, setStories] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(async (pat, org, project, areaPaths) => {
    setLoading(true);
    setError(null);
    try {
      const [storyData, featureData] = await Promise.all([
        fetchStories(pat, org, project, areaPaths),
        fetchFeatures(pat, org, project, areaPaths),
      ]);
      setStories(storyData);
      setFeatures(featureData);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { stories, features, loading, error, lastRefresh, load };
}
