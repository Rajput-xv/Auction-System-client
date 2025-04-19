import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./AuctionItem.css";

const ITEMS_PER_PAGE = 10;

function AuctionItem() {
	const { id } = useParams();
	const [auctionItem, setAuctionItem] = useState(null);
	const [user, setUser] = useState(null);
	const [bids, setBids] = useState([]);
	const [winner, setWinner] = useState("");
	const [countdown, setCountdown] = useState({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const [loadingBids, setLoadingBids] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchAuctionItem = async () => {
			try {
				const res = await axios.get(import.meta.env.VITE_API_URL+`/api/auctions/${id}`);
				setAuctionItem(res.data);
			} catch (error) {
				console.error("Error fetching auction item:", error);
			}
		};

<<<<<<< HEAD
    // Helper function for authenticated requests
    const authRequest = async (url, method = "GET", data = null) => {
        const token = getToken();
        if (!token) {
            throw new Error("Authentication required");
        }
        try {
            const config = {
                method,
                url,
                headers: { Authorization: `Bearer ${token}` },
            };
            
            if (data) {
                config.data = data;
            }
            
            const response = await axios(config);
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                // Handle authentication errors
                navigate("/login");
            }
            throw error;
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                
                // Fetch auction item (doesn't require auth)
                const itemResponse = await axios.get(`${apiUrl}/api/auctions/${id}`);
                setAuctionItem(itemResponse.data);
                
                // Fetch bids if user is logged in
                if (isLoggedIn) {
                    try {
                        const bidsResponse = await authRequest(`${apiUrl}/api/bids/${id}`);
                        const sortedBids = bidsResponse.sort((a, b) => b.bidAmount - a.bidAmount);
                        setBids(sortedBids);
                        setTotalPages(Math.ceil(sortedBids.length / ITEMS_PER_PAGE) || 0);
                    } catch (bidError) {
                        console.error("Error fetching bids:", bidError);
                        // Don't fail the whole component if bids can't be fetched
                    }
                }
                
                // Try to fetch winner if auction has ended
                const endDate = new Date(itemResponse.data.endDate);
                const now = new Date();
                if (endDate <= now) {
                    try {
                        const winnerResponse = await axios.get(`${apiUrl}/api/auctions/winner/${id}`);
                        setWinner(winnerResponse.data.winner);
                    } catch (winnerError) {
                        // Don't fail if winner can't be fetched
                        console.error("Error fetching winner:", winnerError);
                    }
                }
                
                setError(null);
            } catch (error) {
                console.error("Error fetching auction data:", error);
                setError("Failed to load auction details. Please try again later.");
            } finally {
                setLoading(false);
                setLoadingBids(false);
            }
        };
        fetchData();
    }, [id, isLoggedIn, navigate]);
=======
		const fetchUser = async () => {
			const token = document.cookie
				.split("; ")
				.find((row) => row.startsWith("jwt="))
				?.split("=")[1];
			if (token) {
				try {
					const res = await axios.post(
						import.meta.env.VITE_API_URL+"/api/users/profile",
						{},
						{
							headers: { Authorization: `Bearer ${token}` },
						}
					);
					setUser(res.data);
				} catch (error) {
					console.error("Error fetching user profile:", error);
				}
			}
		};

		const fetchWinner = async () => {
			try {
				const res = await axios.get(import.meta.env.VITE_API_URL+`/api/auctions/winner/${id}`);
				setWinner(res.data.winner);
			} catch (error) {
				if (error.response.data.winner !== "") {
					console.error("Error fetching auction winner:", error);
				}
			}
		};

		fetchAuctionItem();
		fetchUser();
		fetchWinner();
	}, [id]);

	useEffect(() => {
		const fetchBids = async () => {
			setLoadingBids(true);
			try {
				const res = await axios.get(import.meta.env.VITE_API_URL+`/api/bids/${id}`);
				const sortedBids = res.data.sort(
					(a, b) => b.bidAmount - a.bidAmount
				);
				setBids(sortedBids);
				setTotalPages(
					Math.ceil(sortedBids.length / ITEMS_PER_PAGE) || 0
				);
			} catch (error) {
				console.error("Error fetching bids:", error);
			} finally {
				setLoadingBids(false);
			}
		};
>>>>>>> parent of a6d6d02 (new update)

		fetchBids();
	}, [id]);

	useEffect(() => {
		const updateCountdown = () => {
			if (auctionItem) {
				const endDate = new Date(auctionItem.endDate);
				const now = new Date();
				const timeDiff = endDate - now;

				if (timeDiff > 0) {
					const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
					const hours = Math.floor(
						(timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
					);
					const minutes = Math.floor(
						(timeDiff % (1000 * 60 * 60)) / (1000 * 60)
					);
					const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

					setCountdown({ days, hours, minutes, seconds });
				} else {
					setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				}
			}
		};

		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	}, [auctionItem]);

<<<<<<< HEAD
    if (error) {
        return (
            <div className="max-w-4xl p-8 mx-auto mt-10 text-white bg-gray-900 rounded-lg shadow-lg">
                <div className="p-4 text-center text-red-500">
                    <p className="text-xl">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 mt-4 text-white bg-indigo-600 rounded hover:bg-indigo-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
=======
	const handleDelete = async () => {
		try {
			await axios.delete(import.meta.env.VITE_API_URL+`/api/auctions/${id}`);
			navigate("/auctions");
		} catch (error) {
			console.error("Error deleting auction item:", error);
		}
	};
>>>>>>> parent of a6d6d02 (new update)

	const handlePageChange = (page) => {
		if (page > 0 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

<<<<<<< HEAD
    const highestBid =
        bids.length > 0 ? Math.max(...bids.map((bid) => bid.bidAmount)) : 0;
    const isAuctionEnded =
        countdown.days <= 0 &&
        countdown.hours <= 0 &&
        countdown.minutes <= 0 &&
        countdown.seconds <= 0;
    
    // Fixed: Compare string representations of IDs to avoid type issues
    const isCreator = authUser && auctionItem.createdBy && 
                     (auctionItem.createdBy.toString() === authUser.id.toString());
=======
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const paginatedBids = bids.slice(startIndex, endIndex);
>>>>>>> parent of a6d6d02 (new update)

	if (!auctionItem || !user) {
		return <p className="mt-10 text-center text-white">Loading...</p>;
	}

	const highestBid =
		bids.length > 0 ? Math.max(...bids.map((bid) => bid.bidAmount)) : 0;
	const isAuctionEnded =
		countdown.days <= 0 &&
		countdown.hours <= 0 &&
		countdown.minutes <= 0 &&
		countdown.seconds <= 0;

	return (
		<div className="max-w-4xl p-8 mx-auto mt-10 text-white bg-gray-900 rounded-lg shadow-lg">
			<h2 className="mb-4 text-4xl font-bold">{auctionItem.title}</h2>
			<p className="mb-4 text-lg">{auctionItem.description}</p>
			<p className="mb-4 text-lg">
				Starting Bid:{" "}
				<span className="font-semibold">
					${auctionItem.startingBid}
				</span>
			</p>
			<p className="mb-4 text-lg">
				Current Highest Bid:{" "}
				<span className="font-semibold">${highestBid}</span>
			</p>
			<div
				className={`text-center mb-4 p-6 rounded-lg shadow-lg ${
					isAuctionEnded ? "bg-red-600" : "bg-green-600"
				}`}
			>
				<h3 className="mb-2 text-3xl font-bold">
					{isAuctionEnded ? "Auction Ended" : "Time Remaining"}
				</h3>
				<div className="countdown-grid">
					{Object.entries(countdown).map(([unit, value]) => (
						<div key={unit} className="countdown-card">
							<div className="countdown-front">
								{value < 10 ? `0${value}` : value}
							</div>
							<div className="countdown-back">
								{unit.charAt(0).toUpperCase()}
							</div>
						</div>
					))}
				</div>
				{isAuctionEnded && winner && (
					<div className="p-4 mt-6 font-bold text-center text-black bg-yellow-500 rounded-lg">
						<h3 className="text-2xl">
							Congratulations {winner.username}!
						</h3>
						<p className="text-xl">
							You are the winner of this auction!
						</p>
					</div>
				)}
				{isAuctionEnded && !winner && (
					<div className="p-4 mt-6 font-bold text-center text-black bg-yellow-500 rounded-lg">
						<h3 className="text-2xl">No Winner !</h3>
					</div>
				)}
			</div>

			<h3 className="mb-4 text-3xl font-bold">Bids</h3>
			{loadingBids ? (
				<p className="text-xl text-gray-400">Loading bids...</p>
			) : paginatedBids.length ? (
				<div className="mb-6">
					{paginatedBids.map((bid) => {
						return (
							<div
								key={bid._id}
								className="p-4 mb-4 bg-gray-700 rounded-lg"
							>
								<p className="text-lg">
									<span className="font-semibold">
										Bidder:
									</span>{" "}
									{bid.userId.username}
								</p>
								<p className="text-lg">
									<span className="font-semibold">
										Bid Amount:
									</span>{" "}
									${bid.bidAmount}
								</p>
							</div>
						);
					})}
					<div className="flex items-center justify-between mt-6">
						<button
							onClick={() => handlePageChange(currentPage - 1)}
							className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
								currentPage === 1 || totalPages === 0
									? "cursor-not-allowed opacity-50"
									: ""
							}`}
							disabled={currentPage === 1 || totalPages === 0}
						>
							Previous
						</button>
						<span className="text-gray-400 ext-center ">
							Page {currentPage} of{" "}
							{totalPages === 0 ? 1 : totalPages}
						</span>
						<button
							onClick={() => handlePageChange(currentPage + 1)}
							className={`bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
								totalPages === 0 || currentPage === totalPages
									? "cursor-not-allowed opacity-50"
									: ""
							}`}
							disabled={
								totalPages === 0 || currentPage === totalPages
							}
						>
							Next
						</button>
					</div>
				</div>
			) : (
				<p className="text-xl text-gray-400">No bids yet.</p>
			)}

			{auctionItem.createdBy === user.id && (
				<div className="flex justify-center mt-6 space-x-4">
					<Link
						to={`/auction/edit/${id}`}
						className="px-6 py-3 text-white bg-blue-700 rounded-lg hover:bg-blue-800"
					>
						Edit
					</Link>
					<button
						onClick={handleDelete}
						className="px-6 py-3 text-white bg-red-700 rounded-lg hover:bg-red-800"
					>
						Delete
					</button>
				</div>
			)}
			{auctionItem.createdBy !== user.id && !isAuctionEnded && (
				<Link
					to={`/auction/bid/${id}`}
					className="items-center justify-center block px-6 py-3 mt-6 text-center text-white bg-blue-700 rounded-lg ite hover:bg-blue-800"
				>
					Place a Bid
				</Link>
			)}
		</div>
	);
}

export default AuctionItem;
