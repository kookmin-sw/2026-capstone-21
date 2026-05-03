const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

useEffect(() => {
  const fetchAll = () => {
    fetch(`${API_BASE_URL}/insights/daily-trends`)
      .then(res => res.json())
      .then(setDailyTrends);

    fetch(`${API_BASE_URL}/insights/category-distribution`)
      .then(res => res.json())
      .then(setCategoryData);

    fetch(`${API_BASE_URL}/insights/total-selections`)
      .then(res => res.json())
      .then(data => setTotalSelections(data.total));

    fetch(`${API_BASE_URL}/insights/total-influencers`)
      .then(res => res.json())
      .then(data => setTotalInfluencers(data.total));
  };

  fetchAll(); // 최초 실행

  const interval = setInterval(fetchAll, 5000); // 5초마다 갱신

  return () => clearInterval(interval);
}, []);
 
