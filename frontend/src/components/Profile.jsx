import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ITEMS_PER_PAGE = 3;

function Profile() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // State for data
    const [auctions, setAuctions] = useState([]);
    const [bids, setBids] = useState([]);
    const [wonAuctions, setWonAuctions] = useState([]);
    
    // State for pagination
    const [currentPageAuctions, setCurrentPageAuctions] = useState(1);
    const [currentPageBids, setCurrentPageBids] = useState(1);
    const [currentPageWon, setCurrentPageWon] = useState(1);
    const [totalPagesAuctions, setTotalPagesAuctions] = useState(1);
    const [totalPagesBids, setTotalPagesBids] = useState(1);
    const [totalPagesWon, setTotalPagesWon] = useState(1);
    
    // State for loading and errors
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Check for success message from navigation state
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // Clear the message after 5 seconds
            const timer = setTimeout(() => {
                setSuccessMessage("");
                // Clear navigation state to prevent message reappearing on refresh
                window.history.replaceState({}, document.title);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [location.state]);

    // Enhanced fetchWithAuth function with better error handling
    const fetchWithAuth = useCallback(async (url, method = "GET", body = {}) => {
        const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];
            
        if (!token) {
            navigate("/login", { state: { message: "Please log in to view your profile" } });
            return null;
        }
        
        try {
            const res = await axios({
                url,
                method,
                data: body,
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            return res.data;
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            if (error.response?.status === 401) {
                navigate("/login", { state: { message: "Your session has expired. Please log in again." } });
            }
            throw error;
        }
    }, [navigate]);

    // Fetch data with proper error handling and loading states
    useEffect(() => {
        // Redirect if not logged in
        if (!isLoggedIn && !user) {
            navigate("/login", { state: { message: "Please log in to view your profile" } });
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                
                // Fetch all data in parallel for better performance
                const [auctionData, bidData, wonData] = await Promise.allSettled([
                    fetchWithAuth(`${apiUrl}/api/auctions/user`),
                    fetchWithAuth(`${apiUrl}/api/bids/user`),
                    fetchWithAuth(`${apiUrl}/api/auctions/won`)
                ]);
                
                // Handle auctions data
                if (auctionData.status === 'fulfilled' && auctionData.value) {
                    const items = auctionData.value.auctionItems || [];
                    setAuctions(items);
                    setTotalPagesAuctions(Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)));
                } else {
                    console.error("Failed to fetch auctions:", auctionData.reason);
                    setError(prev => prev || "Failed to load your auctions. Please try again.");
                }
                
                // Handle bids data
                if (bidData.status === 'fulfilled' && bidData.value) {
                    const items = bidData.value.bids || [];
                    setBids(items);
                    setTotalPagesBids(Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)));
                } else {
                    console.error("Failed to fetch bids:", bidData.reason);
                    setError(prev => prev || "Failed to load your bids. Please try again.");
                }
                
                // Handle won auctions data
                if (wonData.status === 'fulfilled' && wonData.value) {
                    const items = wonData.value.wonAuctions || [];
                    setWonAuctions(items);
                    setTotalPagesWon(Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)));
                } else {
                    console.error("Failed to fetch won auctions:", wonData.reason);
                    setError(prev => prev || "Failed to load your won auctions. Please try again.");
                }
                
            } catch (err) {
                console.error("Error fetching profile data:", err);
                setError("Failed to load profile data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user, isLoggedIn, navigate, fetchWithAuth]);

    // Handle page changes for pagination
    const handlePageChange = useCallback((page, type) => {
        if (page > 0) {
            if (type === "auctions" && page <= totalPagesAuctions) {
                setCurrentPageAuctions(page);
            } else if (type === "bids" && page <= totalPagesBids) {
                setCurrentPageBids(page);
            } else if (type === "won" && page <= totalPagesWon) {
                setCurrentPageWon(page);
            }
        }
    }, [totalPagesAuctions, totalPagesBids, totalPagesWon]);

    // Handle auction deletion with confirmation
    const handleDeleteAuction = useCallback(async (auctionId) => {
        if (!window.confirm("Are you sure you want to delete this auction? This action cannot be undone.")) {
            return;
        }
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            await fetchWithAuth(`${apiUrl}/api/auctions/${auctionId}`, "DELETE");
            
            // Update local state to remove the deleted auction
            setAuctions(prev => prev.filter(auction => auction._id !== auctionId));
            setSuccessMessage("Auction deleted successfully!");
            
            // Update pagination if needed
            const newTotalPages = Math.max(1, Math.ceil((auctions.length - 1) / ITEMS_PER_PAGE));
            setTotalPagesAuctions(newTotalPages);
            if (currentPageAuctions > newTotalPages) {
                setCurrentPageAuctions(newTotalPages);
            }
        } catch (error) {
            console.error("Error deleting auction:", error);
            if (error.response?.data?.message) {
                setError(`Failed to delete auction: ${error.response.data.message}`);
            } else {
                setError("Failed to delete auction. Please try again.");
            }
        }
    }, [auctions.length, currentPageAuctions, fetchWithAuth]);

    // Calculate paginated data - memoized for performance
    const paginatedAuctions = useMemo(() => {
        const startIndex = (currentPageAuctions - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return auctions.slice(startIndex, endIndex);
    }, [auctions, currentPageAuctions]);
    
    const paginatedBids = useMemo(() => {
        const startIndex = (currentPageBids - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return bids.slice(startIndex, endIndex);
    }, [bids, currentPageBids]);
    
    const paginatedWon = useMemo(() => {
        const startIndex = (currentPageWon - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return wonAuctions.slice(startIndex, endIndex);
    }, [wonAuctions, currentPageWon]);

    // Format date for display
    const formatDate = useCallback((dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }, []);

    // Check if auction has ended
    const isAuctionEnded = useCallback((endDate) => {
        return new Date(endDate) < new Date();
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900">
                <div className="w-32 h-32 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Not logged in state
    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
                <h2 className="text-2xl mb-4">Please log in to view your profile</h2>
                <Link to="/login" className="px-6 py-3 bg-purple-600 rounded-lg hover:bg-purple-700">
                    Log In
                </Link>
            </div>
        );
	}

	return (
		<div className="min-h-screen px-4 py-12 text-gray-300 bg-gray-900 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="overflow-hidden bg-gray-800 rounded-lg shadow-xl">
					<div className="p-6 sm:p-10">
						<h2 className="mb-6 text-3xl font-extrabold text-white">
							Profile
						</h2>
						<div className="p-6 mb-8 bg-gray-700 rounded-lg">
							<p className="mb-2 text-lg">
								<span className="font-semibold text-purple-400">
									Username:
								</span>{" "}
								{user.username}
							</p>
							<p className="mb-2 text-lg">
								<span className="font-semibold text-purple-400">
									Email:
								</span>{" "}
								{user.email}
							</p>
						</div>

						<div className="flex items-center justify-between mb-8">
							<h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-teal-500 to-blue-600 animate-pulse">
								Your Auctions 🏛️
							</h2>
							<Link
								to="/auction/create"
								className="inline-block px-6 py-3 text-lg font-semibold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 hover:shadow-lg hover:-translate-y-1"
							>
								Create Auction ➕
							</Link>
						</div>

						{paginatedAuctions.length ? (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{paginatedAuctions.map((auction) => (
									<div
										key={auction._id}
										className="overflow-hidden transition-all duration-300 rounded-lg shadow-md bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-xl hover:scale-105"
									>
										<div className="p-6">
											<h3 className="mb-3 text-2xl font-bold text-white">
												{auction.title}
											</h3>
											<p className="mb-4 text-gray-300">
												{auction.description}
											</p>
											<p className="mb-2 text-lg">
												<span className="font-semibold text-teal-400">
													Starting Bid:
												</span>{" "}
												<span className="font-bold text-green-400">
													${auction.startingBid}
												</span>
											</p>
											<p className="mb-4">
												<span className="font-semibold text-teal-400">
													End Date:
												</span>{" "}
												<span className="text-blue-300">
													{new Date(
														auction.endDate
													).toLocaleString()}
												</span>
											</p>
											<Link
												to={`/auction/${auction._id}`}
												className="inline-block px-6 py-3 text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 hover:shadow-md hover:-translate-y-1"
											>
												View Auction 🔍
											</Link>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-2xl text-gray-400 animate-pulse">
								No active auctions. Ready to start selling? 💼
							</p>
						)}

						<div className="flex items-center justify-between mt-6">
							<button
								onClick={() =>
									handlePageChange(
										currentPageAuctions - 1,
										"auctions"
									)
								}
								className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
									currentPageAuctions === 1
										? "cursor-not-allowed opacity-50"
										: ""
								}`}
								disabled={currentPageAuctions === 1}
							>
								Previous
							</button>
							<span className="text-gray-400">
								Page {currentPageAuctions} of{" "}
								{totalPagesAuctions === 0
									? 1
									: totalPagesAuctions}
							</span>
							<button
								onClick={() =>
									handlePageChange(
										currentPageAuctions + 1,
										"auctions"
									)
								}
								className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
									currentPageAuctions ===
										totalPagesAuctions ||
									totalPagesAuctions === 0
										? "cursor-not-allowed opacity-50"
										: ""
								}`}
								disabled={
									currentPageAuctions ===
										totalPagesAuctions ||
									totalPagesAuctions === 0
								}
							>
								Next
							</button>
						</div>

						<div className="mt-12">
							<h2 className="mb-8 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 animate-pulse">
								Your Bids 🎭
							</h2>

							{paginatedBids.length ? (
								<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
									{paginatedBids.map((bid) => (
										<div
											key={bid._id}
											className="overflow-hidden transition-all duration-300 rounded-lg shadow-md bg-gradient-to-br from-gray-800 to-gray-900 hover:shadow-xl hover:scale-105"
										>
											<div className="p-6">
												<h3 className="mb-3 text-2xl font-bold text-white">
													{bid.auctionItem.title}
												</h3>
												<p className="mb-4 text-gray-300">
													{
														bid.auctionItem
															.description
													}
												</p>
												<p className="mb-2 text-lg">
													<span className="font-semibold text-cyan-400">
														Bid Amount:
													</span>{" "}
													<span className="font-bold text-green-400">
														${bid.bidAmount}
													</span>
												</p>
												<p className="mb-4">
													<span className="font-semibold text-cyan-400">
														Bid Date:
													</span>{" "}
													<span className="text-blue-300">
														{new Date(
															bid.createdAt
														).toLocaleString()}
													</span>
												</p>
												<Link
													to={`/auction/${bid.auctionItem._id}`}
													className="inline-block px-6 py-3 text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:shadow-md hover:-translate-y-1"
												>
													View Auction 🔍
												</Link>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-2xl text-gray-400 animate-pulse">
									No active bids. Ready to join the
									excitement? 🚀
								</p>
							)}

							<div className="flex items-center justify-between mt-6">
								<button
									onClick={() =>
										handlePageChange(
											currentPageBids - 1,
											"bids"
										)
									}
									className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
										currentPageBids === 1
											? "cursor-not-allowed opacity-50"
											: ""
									}`}
									disabled={currentPageBids === 1}
								>
									Previous
								</button>
								<span className="text-gray-400">
									Page {currentPageBids} of{" "}
									{totalPagesBids === 0 ? 1 : totalPagesBids}
								</span>
								<button
									onClick={() =>
										handlePageChange(
											currentPageBids + 1,
											"bids"
										)
									}
									className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
										currentPageBids === totalPagesBids ||
										totalPagesBids === 0
											? "cursor-not-allowed opacity-50"
											: ""
									}`}
									disabled={
										currentPageBids === totalPagesBids ||
										totalPagesBids === 0
									}
								>
									Next
								</button>
							</div>
						</div>

						<div className="mt-12">
							<h2 className="mb-8 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse">
								🏆 Your Victorious Auctions 🏆
							</h2>

							{paginatedWon.length ? (
								<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
									{paginatedWon.map((auction) => (
										<div
											key={auction.auctionId}
											className="overflow-hidden transition-all duration-300 rounded-lg shadow-lg hover:shadow-2xl hover:scale-105 bg-gradient-to-br from-purple-600 via-pink-500 to-red-500"
										>
											<div className="p-6 bg-gray-900 bg-opacity-80">
												<h3 className="mb-3 text-2xl font-bold text-white">
													{auction.title}
												</h3>
												<p className="mb-4 text-gray-300">
													{auction.description}
												</p>
												<p className="mb-2 text-lg">
													<span className="font-semibold text-yellow-300">
														Winning Bid:
													</span>{" "}
													<span className="font-bold text-green-400">
														${auction.winningBid}
													</span>
												</p>
												<p className="mb-4">
													<span className="font-semibold text-yellow-300">
														End Date:
													</span>{" "}
													<span className="text-blue-400">
														{new Date(
															auction.endDate
														).toLocaleString()}
													</span>
												</p>
												<Link
													to={`/auction/${auction.auctionId}`}
													className="inline-block px-6 py-3 text-lg font-semibold text-white transition-all duration-300 transform rounded-full bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 hover:shadow-md hover:-translate-y-1"
												>
													View Your Auction Item 🎉
												</Link>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-2xl text-gray-400 animate-bounce">
									No victories yet, but your winning moment is
									coming soon! 🌟
								</p>
							)}

							<div className="flex items-center justify-between mt-6">
								<button
									onClick={() =>
										handlePageChange(
											currentPageWon - 1,
											"won"
										)
									}
									className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
										currentPageWon === 1
											? "cursor-not-allowed opacity-50"
											: ""
									}`}
									disabled={currentPageWon === 1}
								>
									Previous
								</button>
								<span className="text-gray-400">
									Page {currentPageWon} of{" "}
									{totalPagesWon === 0 ? 1 : totalPagesWon}
								</span>
								<button
									onClick={() =>
										handlePageChange(
											currentPageWon + 1,
											"won"
										)
									}
									className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
										currentPageWon === totalPagesWon ||
										totalPagesWon === 0
											? "cursor-not-allowed opacity-50"
											: ""
									}`}
									disabled={
										currentPageWon === totalPagesWon ||
										totalPagesWon === 0
									}
								>
									Next
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Profile;
