const BASE_URL = 'http://localhost:8000/admin';

function getAuthHeaders() {
  const token = localStorage.getItem('access_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export type AdminInfluencerSearchParams = {
  keywords?: string;
  minFollowers?: string;
  minPosts?: string;
  lastPostDate?: string;
};

export type AdminInfluencerSearchResult = {
  influencer_id: number;
  username: string;
  full_name: string | null;
  profile_pic_url: string | null;
  followers_count: number;
  posts_count: number;
  category: string;
  last_post_date: string | null;
  style_keywords_text: string | null;
};

export type KeywordCrawlParams = {
  keywords: string[];
  maxResults?: number;
  minFollowers?: number;
  minPosts?: number;
  followRatio?: number;
  engagementRate?: number;
  lastPostDate?: string;
};

export async function searchInfluencersForAdmin(
  params: AdminInfluencerSearchParams
): Promise<AdminInfluencerSearchResult[]> {
  const searchParams = new URLSearchParams();

  if (params.keywords?.trim()) {
    searchParams.append('keywords', params.keywords.trim());
  }

  if (params.minFollowers?.trim()) {
    searchParams.append('min_followers', params.minFollowers.trim());
  }

  if (params.minPosts?.trim()) {
    searchParams.append('min_posts', params.minPosts.trim());
  }

  if (params.lastPostDate?.trim()) {
    searchParams.append('last_post_date', params.lastPostDate.trim());
  }

  const queryString = searchParams.toString();

  const res = await fetch(
    `${BASE_URL}/search-influencers${queryString ? `?${queryString}` : ''}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function crawlInfluencersByKeywords(params: KeywordCrawlParams) {
  const res = await fetch(`${BASE_URL}/crawl-by-keywords`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      keywords: params.keywords,
      max_results: params.maxResults ?? 50,
      min_followers: params.minFollowers ?? 1000,
      min_posts: params.minPosts ?? 30,
      follow_ratio: params.followRatio ?? 0.5,
      engagement_rate: params.engagementRate ?? 0.01,
      last_post_date: params.lastPostDate || null,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function deleteInfluencerForAdmin(influencerId: number) {
  const res = await fetch(`${BASE_URL}/influencers/${influencerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}
