import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import auth context

const BidForm = () => {
    const { id } = useParams();
    const { isLoggedIn } = useAuth(); // Use auth context to check login status
    const [auctionItem, setAuctionItem] = useState(null);
    const [bidAmount, setBidAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [highestBid, setHighestBid] = useState(0);
    const [formError, setFormError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if not logged in
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                
                // Fetch auction item
                const itemRes = await axios.get(`${apiUrl}/api/auctions/${id}`);
                setAuctionItem(itemRes.data);
                
                // Set initial bid amount to starting bid
                setBidAmount(itemRes.data.startingBid || "");
                
                // Check if auction has ended
                const endDate = new Date(itemRes.data.endDate);
                if (endDate <= new Date()) {
                    setError("This auction has ended. You cannot place bids anymore.");
                    return;
                }
                
                // Fetch current bids to determine highest bid
                const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("jwt="))
                    ?.split("=")[1];
                
                if (token) {
                    try {
                        const bidsRes = await axios.get(
                            `${apiUrl}/api/bids/${id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        if (bidsRes.data && bidsRes.data.length > 0) {
                            const highest = Math.max(...bidsRes.data.map(bid => bid.bidAmount));
                            setHighestBid(highest);
                            // Set initial bid to be higher than current highest
                            setBidAmount(Math.max(highest + 1, itemRes.data.startingBid));
                        }
                    } catch (bidError) {
                        console.error("Error fetching bids:", bidError);
                        // Don't fail completely if bids can't be fetched
                    }
                }
            } catch (err) {
                console.error("Error fetching auction item:", err);
                setError("Failed to load auction details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate, isLoggedIn]);

    const validateBid = () => {
        const bidValue = parseFloat(bidAmount);
        
        if (!bidValue || isNaN(bidValue)) {
            setFormError("Please enter a valid bid amount");
            return false;
        }
        
        if (bidValue < auctionItem.startingBid) {
            setFormError(`Bid must be at least the starting bid of $${auctionItem.startingBid}`);
            return false;
        }
        
        if (highestBid > 0 && bidValue <= highestBid) {
            setFormError(`Bid must be higher than the current highest bid of $${highestBid}`);
            return false;
        }
        
        setFormError("");
        return true;
    };

    const handleBid = async (e) => {
        e.preventDefault();
        
        if (!validateBid()) {
            return;
        }
        
        setSubmitting(true);
        try {
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("jwt="))
                ?.split("=")[1];
                
            if (!token) {
                setError("You must be logged in to place a bid");
                navigate("/login");
                return;
            }
            
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            await axios.post(
                `${apiUrl}/api/bids`,
                { auctionItemId: id, bidAmount: parseFloat(bidAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Success - redirect back to auction page
            navigate(`/auction/${id}`);
        } catch (err) {
            console.error("Error placing bid:", err);
            if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
                navigate("/login");
            } else if (err.response?.data?.message) {
                setFormError(err.response.data.message);
            } else {
                setFormError("Failed to place bid. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 mt-12">
                <div className="w-12 h-12 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-lg p-6 mx-auto mt-12 bg-white rounded-lg shadow-md">
                <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                    <p>{error}</p>
                </div>
                <div className="flex justify-center">
                    <Link 
                        to={`/auction/${id}`}
                        className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        Back to Auction
                    </Link>
                </div>
            </div>
        );
    }

    if (!auctionItem) {
        return (
            <div className="max-w-lg p-6 mx-auto mt-12 bg-white rounded-lg shadow-md">
                <p className="text-center text-gray-700">Auction not found</p>
                <div className="flex justify-center mt-4">
                    <Link 
                        to="/auctions"
                        className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                    >
                        Browse Auctions
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg p-6 mx-auto mt-12 bg-white rounded-lg shadow-md">
            <h2 className="mb-6 text-3xl font-extrabold text-gray-800">
                Place a Bid
            </h2>
            
            <div className="p-4 mb-6 bg-gray-100 border border-gray-200 rounded-lg">
                <h3 className="mb-2 text-xl font-bold text-gray-800">
                    {auctionItem.title}
                </h3>
                <p className="mb-4 text-gray-600">{auctionItem.description}</p>
                <div className="flex justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            Starting Bid:
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                            ${auctionItem.startingBid.toFixed(2)}
                        </p>
                    </div>
                    {highestBid > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700">
                                Current Highest Bid:
                            </p>
                            <p className="text-lg font-bold text-green-600">
                                ${highestBid.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {formError && (
                <div className="p-3 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg">
                    <p>{formError}</p>
                </div>
            )}
            
            <form onSubmit={handleBid} className="space-y-4">
                <div>
                    <label className="block mb-2 text-lg font-medium text-gray-700">
                        Your Bid Amount
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                            type="number"
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={Math.max(auctionItem.startingBid, highestBid + 0.01)}
                            step="0.01"
                            required
                            disabled={submitting}
                        />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        {highestBid > 0 
                            ? `Your bid must be higher than $${highestBid.toFixed(2)}`
                            : `Your bid must be at least $${auctionItem.startingBid.toFixed(2)}`
                        }
                    </p>
                </div>
                
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className={`flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={submitting}
                    >
                        {submitting ? "Placing Bid..." : "Place Bid"}
                    </button>
                    
                    <Link
                        to={`/auction/${id}`}
                        className="flex-1 px-4 py-2 text-center text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default BidForm;
