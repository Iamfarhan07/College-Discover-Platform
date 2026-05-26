import { useState, useEffect } from "react";
import Head from "next/head";

interface Course {
  id: number;
  name: string;
  duration: string;
  fees: number;
}

interface Placement {
  averagePackage: number;
  highestPackage: number;
  topRecruiters: string[];
}

interface Review {
  id: number;
  comment: string;
  rating: number;
  createdAt: string;
  user: {
    name: string;
  };
}

interface College {
  id: number;
  name: string;
  location: string;
  fees: number;
  rating: number;
  type: string;
  established: number;
  overview: string;
  imageUrl: string;
  courses?: Course[];
  placement?: Placement;
  reviews?: Review[];
}

export default function Home() {
  // Authentication & User State
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [savedColleges, setSavedColleges] = useState<number[]>([]);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);

  // Colleges Listing State
  const [colleges, setColleges] = useState<College[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [maxFees, setMaxFees] = useState<number>(2000000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Detail Modal State
  const [detailCollege, setDetailCollege] = useState<College | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "courses" | "reviews">("overview");
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLimit] = useState(3);
  const [detailLoading, setDetailLoading] = useState(false);

  // Comparison State
  const [compareList, setCompareList] = useState<College[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  // Static list of locations from our seed data for quick filters
  const locations = [
    { label: "All Locations", value: "" },
    { label: "Mumbai", value: "Mumbai" },
    { label: "Delhi", value: "Delhi" },
    { label: "Bangalore", value: "Bangalore" },
    { label: "Pilani", value: "Pilani" },
    { label: "Pune", value: "Pune" },
    { label: "Chennai", value: "Chennai" },
    { label: "Vellore", value: "Vellore" },
    { label: "Kolkata", value: "Kolkata" },
  ];

  // Initialize auth states from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch saved colleges if logged in
  useEffect(() => {
    if (token) {
      fetchSavedColleges();
    } else {
      setSavedColleges([]);
    }
  }, [token]);

  // Fetch colleges when filters change
  useEffect(() => {
    fetchColleges();
  }, [search, selectedLocation, maxFees, minRating, sortBy, page]);

  // Fetch reviews when review page changes on detail modal
  useEffect(() => {
    if (detailCollege) {
      loadCollegeDetail(detailCollege.id);
    }
  }, [reviewPage]);

  // Fetch Main Colleges List
  const fetchColleges = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        search: search.length >= 2 ? search : "",
        location: selectedLocation,
        maxFees: maxFees.toString(),
        minRating: minRating.toString(),
        sortBy,
        page: page.toString(),
        limit: "6",
      });

      const res = await fetch(`/api/colleges?${query}`);
      const result = await res.json();
      if (res.ok) {
        setColleges(result.data || []);
        setMeta(result.meta || { total: 0, page: 1, limit: 6, totalPages: 1 });
      }
    } catch (err) {
      console.error("Error fetching colleges:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Saved Colleges
  const fetchSavedColleges = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/saved/colleges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setSavedColleges(data.map((c: any) => c.id));
      }
    } catch (err) {
      console.error("Error loading saved colleges:", err);
    }
  };

  // Toggle Save / Unsave College
  const handleSaveToggle = async (collegeId: number) => {
    if (!token) {
      setAuthModal("login");
      return;
    }

    const isSaved = savedColleges.includes(collegeId);
    try {
      if (isSaved) {
        // DELETE
        const res = await fetch(`/api/saved/colleges/${collegeId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setSavedColleges(prev => prev.filter(id => id !== collegeId));
        }
      } else {
        // POST
        const res = await fetch("/api/saved/colleges", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ collegeId }),
        });
        if (res.ok) {
          setSavedColleges(prev => [...prev, collegeId]);
        }
      }
    } catch (err) {
      console.error("Error toggling saved college:", err);
    }
  };

  // Load College Detail for Modal
  const loadCollegeDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/colleges/${id}?reviewPage=${reviewPage}&reviewLimit=${reviewLimit}`);
      const data = await res.json();
      if (res.ok) {
        setDetailCollege(data);
      }
    } catch (err) {
      console.error("Error loading college detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Perform Side-by-Side Comparison
  const fetchCompareDetails = async (collegesToCompare: College[]) => {
    if (collegesToCompare.length < 2) return;
    setCompareLoading(true);
    try {
      const ids = collegesToCompare.map(c => c.id).join(",");
      const res = await fetch(`/api/colleges/compare?ids=${ids}`);
      const data = await res.json();
      if (res.ok) {
        setCompareData(data);
      }
    } catch (err) {
      console.error("Error loading comparison details:", err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Auth Submit Action
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const endpoint = authModal === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        setAuthModal(null);
        setAuthForm({ name: "", email: "", password: "" });
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch (err) {
      setAuthError("An error occurred during authentication");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setSavedColleges([]);
  };

  const toggleCompare = (college: College) => {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === college.id);
      if (exists) {
        return prev.filter(c => c.id !== college.id);
      }
      if (prev.length >= 3) {
        alert("You can compare a maximum of 3 colleges side by side.");
        return prev;
      }
      return [...prev, college];
    });
  };

  // Helpers for displaying currency/money nicely
  const formatINR = (num: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatLPA = (num: number) => {
    return `${(num / 100000).toFixed(1)} LPA`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-[#f3f4f6] selection:bg-indigo-500 selection:text-white pb-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/10 blur-[130px] pointer-events-none" />

      {/* NAVIGATION BAR */}
      <nav className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#090d16]/75 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Discover
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-indigo-400/80">{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setAuthError(null);
                    setAuthModal("login");
                  }}
                  className="px-4 py-2 text-sm font-medium hover:text-white transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthError(null);
                    setAuthModal("register");
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          🎯 AI Internship Assessment Platform
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6">
          Find Your Perfect{" "}
          <span className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Engineering College
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-400 mb-10">
          Discover placements, course configurations, reviews, and compare options side-by-side in real-time.
        </p>

        {/* Global Search Bar */}
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center bg-[#0d1527] border border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50">
            <span className="pl-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search colleges (e.g. IIT Bombay, Delhi)..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-4 bg-transparent outline-none border-none text-white placeholder-gray-500 text-sm font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="pr-4 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          
          {/* SIDEBAR FILTERS */}
          <aside className="lg:col-span-1 space-y-6 mb-8 lg:mb-0">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <h3 className="font-bold text-lg text-white">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedLocation("");
                    setMaxFees(2000000);
                    setMinRating(0);
                    setSortBy("rating_desc");
                    setSearch("");
                    setPage(1);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Reset All
                </button>
              </div>

              {/* Location Pill Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {locations.map(loc => (
                    <button
                      key={loc.value}
                      onClick={() => {
                        setSelectedLocation(loc.value);
                        setPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                        selectedLocation === loc.value
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5"
                          : "border-white/5 bg-white/5 text-gray-400 hover:text-white hover:border-white/10"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Fees Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Max Annual Fees</label>
                  <span className="text-xs font-bold text-emerald-400">{formatINR(maxFees)}</span>
                </div>
                <input
                  type="range"
                  min={100000}
                  max={2000000}
                  step={50000}
                  value={maxFees}
                  onChange={e => {
                    setMaxFees(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                  <span>100K</span>
                  <span>1.0M</span>
                  <span>2.0M</span>
                </div>
              </div>

              {/* Min Rating Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Minimum Rating</label>
                <div className="flex items-center gap-1.5">
                  {[0, 4.0, 4.3, 4.6, 4.8].map(stars => (
                    <button
                      key={stars}
                      onClick={() => {
                        setMinRating(stars);
                        setPage(1);
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all duration-200 ${
                        minRating === stars
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "border-white/5 bg-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      {stars === 0 ? "All" : `${stars}★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Dropdown */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-[#0c1322] text-sm text-white font-medium outline-none focus:border-indigo-500"
                >
                  <option value="rating_desc">Highest Rated (Default)</option>
                  <option value="fees_asc">Fees: Low to High</option>
                  <option value="fees_desc">Fees: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          {/* COLLEGES GRID */}
          <section className="lg:col-span-3 space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <p className="text-sm font-semibold text-gray-400">Loading colleges...</p>
              </div>
            ) : colleges.length === 0 ? (
              <div className="glass-panel p-16 rounded-2xl text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-400">
                  ⚠️
                </div>
                <h3 className="text-xl font-bold text-white">No Colleges Found</h3>
                <p className="text-gray-400 max-w-sm mx-auto text-sm">
                  Try adjusting your search criteria, raising your max fees, or resetting all filters.
                </p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 gap-6">
                  {colleges.map(college => {
                    const isSaved = savedColleges.includes(college.id);
                    const isComparing = compareList.some(c => c.id === college.id);
                    return (
                      <div key={college.id} className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group">
                        
                        {/* College Header Media */}
                        <div className="h-44 relative bg-gray-900 overflow-hidden">
                          {college.imageUrl ? (
                            <img
                              src={college.imageUrl}
                              alt={college.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center text-gray-400 font-semibold">
                              College Hub
                            </div>
                          )}
                          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#090d16]/80 text-indigo-300 uppercase tracking-widest backdrop-blur-sm border border-indigo-500/30">
                            {college.type}
                          </div>
                          
                          <button
                            onClick={() => handleSaveToggle(college.id)}
                            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#090d16]/80 backdrop-blur-sm border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={isSaved ? "#f87171" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke={isSaved ? "#f87171" : "currentColor"} className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                          </button>
                        </div>

                        {/* College Info */}
                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-extrabold text-lg text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                {college.name}
                              </h4>
                              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-xs font-bold">
                                <span>{college.rating.toFixed(1)}</span>
                                <span>★</span>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-400 flex items-center gap-1 font-semibold">
                              <span>📍</span>
                              <span>{college.location}</span>
                              <span className="mx-1">•</span>
                              <span>Est. {college.established}</span>
                            </p>
                          </div>

                          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                            <div>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Annual Fees</p>
                              <p className="text-sm font-black text-emerald-400">{formatINR(college.fees)}</p>
                            </div>
                            <button
                              onClick={() => {
                                setReviewPage(1);
                                setDetailTab("overview");
                                loadCollegeDetail(college.id);
                              }}
                              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>

                        {/* Compare Toggle Footer */}
                        <div className="px-6 py-3 bg-[#0d1424]/40 border-t border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-gray-500 font-semibold">
                            ID: #{college.id}
                          </span>
                          <button
                            onClick={() => toggleCompare(college)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                              isComparing
                                ? "bg-purple-600/25 border border-purple-500 text-purple-300"
                                : "bg-white/5 border border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                            }`}
                          >
                            {isComparing ? "✓ Added to Compare" : "+ Compare"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* PAGINATION CONTROLS */}
                {meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition duration-200"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-bold text-gray-400">
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <button
                      disabled={page === meta.totalPages}
                      onClick={() => setPage(p => Math.min(p + 1, meta.totalPages))}
                      className="px-4 py-2 text-sm font-semibold rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition duration-200"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* FLOATING COMPARE TRAY */}
      {compareList.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-4 md:px-8">
          <div className="max-w-4xl mx-auto glass-panel px-6 py-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center md:text-left">
                <h4 className="font-extrabold text-sm text-white">Compare Tray</h4>
                <p className="text-[10px] text-gray-400 font-semibold">{compareList.length} of 3 selected</p>
              </div>
              <div className="flex gap-2">
                {compareList.map(c => (
                  <div key={c.id} className="px-3 py-1.5 rounded-lg border border-white/5 bg-[#090d16]/80 flex items-center gap-2 text-xs font-semibold">
                    <span className="truncate max-w-[120px]">{c.name}</span>
                    <button
                      onClick={() => toggleCompare(c)}
                      className="text-gray-400 hover:text-red-400 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setCompareList([])}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-white/10 text-xs font-bold hover:text-white"
              >
                Clear
              </button>
              <button
                disabled={compareList.length < 2}
                onClick={() => {
                  fetchCompareDetails(compareList);
                  setShowCompareModal(true);
                }}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition duration-200"
              >
                Compare Now Side-by-Side
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {detailCollege && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-white/10 max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
            
            {/* Modal Header Media */}
            <div className="h-56 relative bg-gray-900">
              {detailCollege.imageUrl && (
                <img
                  src={detailCollege.imageUrl}
                  alt={detailCollege.name}
                  className="w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220] via-[#0b1220]/20 to-transparent" />
              <button
                onClick={() => setDetailCollege(null)}
                className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/60 border border-white/15 hover:border-white/30 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
              
              <div className="absolute bottom-6 left-6 right-6 space-y-2">
                <span className="px-2.5 py-1 rounded bg-indigo-600 text-[10px] font-bold text-white uppercase tracking-wider border border-indigo-500/30">
                  {detailCollege.type}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">{detailCollege.name}</h2>
                <p className="text-xs text-indigo-300 font-semibold flex items-center gap-1">
                  <span>📍 {detailCollege.location}</span>
                  <span className="mx-1">•</span>
                  <span>Established: {detailCollege.established}</span>
                  <span className="mx-1">•</span>
                  <span className="text-amber-300">★ {detailCollege.rating.toFixed(1)}</span>
                </p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="border-b border-white/5 bg-[#0d1424]/40 px-6 py-2 flex gap-4">
              {(["overview", "courses", "reviews"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`py-3 px-1 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-200 ${
                    detailTab === tab
                      ? "border-indigo-500 text-indigo-400"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Content Area */}
            <div className="p-6 overflow-y-auto flex-1 max-h-[40vh] space-y-6">
              
              {/* TAB 1: OVERVIEW */}
              {detailTab === "overview" && (
                <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Overview</h3>
                    <p>{detailCollege.overview}</p>
                  </div>

                  {/* Placements Cards */}
                  <div className="space-y-3">
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Placements Record</h3>
                    {detailCollege.placement ? (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5">
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Average Package</p>
                          <p className="text-xl font-black text-emerald-300">{formatLPA(detailCollege.placement.averagePackage)}</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/5">
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Highest Package</p>
                          <p className="text-xl font-black text-indigo-300">{formatLPA(detailCollege.placement.highestPackage)}</p>
                        </div>
                        {detailCollege.placement.topRecruiters && detailCollege.placement.topRecruiters.length > 0 && (
                          <div className="sm:col-span-2 space-y-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Top Recruiters</p>
                            <div className="flex flex-wrap gap-1.5">
                              {detailCollege.placement.topRecruiters.map(r => (
                                <span key={r} className="px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[11px] text-gray-300 font-medium">
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No placement profile listed.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: COURSES */}
              {detailTab === "courses" && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider mb-2">Available Configurations</h3>
                  {detailCollege.courses && detailCollege.courses.length > 0 ? (
                    <div className="space-y-3">
                      {detailCollege.courses.map(course => (
                        <div key={course.id} className="p-4 rounded-2xl border border-white/5 bg-[#0d1424]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="font-extrabold text-sm text-white">{course.name}</p>
                            <p className="text-xs text-gray-400 font-medium">Duration: {course.duration}</p>
                          </div>
                          <p className="text-xs font-bold text-emerald-400 border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 rounded-lg">
                            {formatINR(course.fees)} / Year
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No course configurations loaded.</p>
                  )}
                </div>
              )}

              {/* TAB 3: REVIEWS */}
              {detailTab === "reviews" && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider mb-2">Student Reviews</h3>
                  {detailCollege.reviews && detailCollege.reviews.length > 0 ? (
                    <div className="space-y-4">
                      {detailCollege.reviews.map(review => (
                        <div key={review.id} className="p-4 rounded-2xl border border-white/5 bg-[#0d1424]/40 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white">{review.user.name}</p>
                            <div className="flex items-center gap-0.5 text-amber-300 font-bold text-xs bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                              <span>{review.rating.toFixed(1)}</span>
                              <span>★</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed font-medium">
                            "{review.comment}"
                          </p>
                          <p className="text-[10px] text-gray-500 font-semibold">
                            Date: {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}

                      {/* Detail Reviews Navigation */}
                      <div className="flex items-center justify-center gap-3 pt-3">
                        <button
                          disabled={reviewPage === 1}
                          onClick={() => setReviewPage(p => Math.max(p - 1, 1))}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <span className="text-xs text-gray-400 font-bold">Review Page {reviewPage}</span>
                        <button
                          onClick={() => setReviewPage(p => p + 1)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No reviews loaded or page is empty.</p>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/5 bg-[#0d1424]/20 flex justify-end">
              <button
                onClick={() => setDetailCollege(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 active:scale-[0.98] transition duration-200"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-white/10 max-w-5xl w-full rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col justify-between">
            
            <div className="p-6 border-b border-white/5 bg-[#0d1424]/40 flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-white">Side-by-Side College Comparison</h2>
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareData([]);
                }}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:border-white/20 text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-x-auto flex-1">
              {compareLoading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <p className="text-xs font-semibold text-gray-400">Loading comparison details...</p>
                </div>
              ) : compareData.length === 0 ? (
                <p className="text-sm text-gray-400 italic text-center py-12">Failed to load comparison data.</p>
              ) : (
                <table className="w-full text-left text-sm text-gray-300 border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 font-extrabold text-gray-400 text-xs uppercase tracking-wider w-1/4">Criteria</th>
                      {compareData.map(c => (
                        <th key={c.id} className="py-4 px-4 font-black text-white text-sm w-1/4">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Location</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-semibold">{c.location}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Rating</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-bold text-amber-300">★ {c.rating.toFixed(1)}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Type</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-semibold uppercase tracking-wider text-xs">{c.type}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Established</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-semibold">Year {c.established}</td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Average Placement</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-black text-emerald-400">
                          {c.placement?.averagePackage ? formatLPA(c.placement.averagePackage) : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Highest Placement</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 font-black text-indigo-300">
                          {c.placement?.highestPackage ? formatLPA(c.placement.highestPackage) : "N/A"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-gray-400">Configured Courses</td>
                      {compareData.map(c => (
                        <td key={c.id} className="py-4 px-4 text-xs space-y-1">
                          {c.courses && c.courses.length > 0 ? (
                            c.courses.map((course: any) => (
                              <div key={course.id} className="text-gray-300 font-medium">
                                • {course.name} ({formatINR(course.fees)}/Yr)
                              </div>
                            ))
                          ) : (
                            <span className="italic text-gray-500">None</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-[#0d1424]/20 flex justify-end">
              <button
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareData([]);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-500/25 transition duration-200"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AUTHENTICATION OVERLAY MODALS */}
      {authModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1220] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl relative">
            <button
              onClick={() => setAuthModal(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-black text-white mb-2">
              {authModal === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-xs text-gray-400 mb-6 font-semibold">
              {authModal === "login"
                ? "Enter your credentials to manage bookmarks."
                : "Create an account to start saving colleges."}
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authModal === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={authForm.name}
                    onChange={e => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0c1322] text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={authForm.email}
                  onChange={e => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0c1322] text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authForm.password}
                  onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#0c1322] text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-semibold">
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-md shadow-indigo-500/25 active:scale-[0.98] transition duration-200"
              >
                {authModal === "login" ? "Sign In" : "Register Now"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400">
              {authModal === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setAuthModal("register");
                    }}
                    className="text-indigo-400 hover:underline font-bold"
                  >
                    Register
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setAuthError(null);
                      setAuthModal("login");
                    }}
                    className="text-indigo-400 hover:underline font-bold"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
