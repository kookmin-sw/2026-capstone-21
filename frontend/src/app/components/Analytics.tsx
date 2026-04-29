useEffect(() => {
  const fetchAll = () => {
    fetch("http://localhost:8000/insights/daily-trends")
      .then(res => res.json())
      .then(setDailyTrends);

    fetch("http://localhost:8000/insights/category-distribution")
      .then(res => res.json())
      .then(setCategoryData);

    fetch("http://localhost:8000/insights/total-selections")
      .then(res => res.json())
      .then(data => setTotalSelections(data.total));

    fetch("http://localhost:8000/insights/total-influencers")
      .then(res => res.json())
      .then(data => setTotalInfluencers(data.total));
  };

  fetchAll(); // 최초 실행

  const interval = setInterval(fetchAll, 5000); // 5초마다 갱신

  return () => clearInterval(interval);
}, []);
 
