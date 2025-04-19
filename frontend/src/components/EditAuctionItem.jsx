import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import auth context

const EditAuctionItem = () => {
    const { id } = useParams();
    const { isLoggedIn } = useAuth(); // Use auth context
    const [auctionItem, setAuctionItem] = useState({
        title: "",
        description: "",
        startingBid: "",
        endDate: "",
    });
    const [originalItem, setOriginalItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if not logged in
        if (!isLoggedIn) {
            navigate("/login");
            return;
        }

        const fetchAuctionItem = async () => {
            setLoading(true);
            try {
                const token = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("jwt="))
                    ?.split("=")[1];

                if (!token) {
                    setError("You must be logged in to edit an auction");
                    navigate("/login");
                    return;
                }

                const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                const res = await axios.get(`${apiUrl}/api/auctions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                // Format the date for the datetime-local input
                const endDate = new Date(res.data.endDate);
                const formattedDate = endDate.toISOString().slice(0, 16);
                
                const formattedItem = {
                    ...res.data,
                    endDate: formattedDate
                };
                
                setAuctionItem(formattedItem);
                setOriginalItem(res.data); // Keep original for comparison
                setError("");
            } catch (err) {
                console.error("Error fetching auction item:", err);
                if (err.response?.status === 404) {
                    setError("Auction item not found");
                } else if (err.response?.status === 403) {
                    setError("You don't have permission to edit this auction");
                } else if (err.response?.status === 401) {
                    setError("Please log in to edit this auction");
                    navigate("/login");
                } else {
                    setError("Failed to load auction details. Please try again.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAuctionItem();
    }, [id, navigate, isLoggedIn]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAuctionItem((prev) => ({
            ...prev,
            [name]: value,
        }));
        
        // Clear validation error when field is edited
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const validateForm = () => {
        const errors = {};
        
        if (!auctionItem.title.trim()) {
            errors.title = "Title is required";
        } else if (auctionItem.title.length < 3) {
            errors.title = "Title must be at least 3 characters";
        }
        
        if (!auctionItem.description.trim()) {
            errors.description = "Description is required";
        } else if (auctionItem.description.length < 10) {
            errors.description = "Description must be at least 10 characters";
        }
        
        if (!auctionItem.startingBid) {
            errors.startingBid = "Starting bid is required";
        } else if (parseFloat(auctionItem.startingBid) <= 0) {
            errors.startingBid = "Starting bid must be greater than 0";
        }
        
        if (!auctionItem.endDate) {
            errors.endDate = "End date is required";
        } else {
            // Check if auction has already started (has bids)
            if (originalItem && originalItem.hasBids) {
                // If auction has bids, don't allow changing end date to earlier
                const newEndDate = new Date(auctionItem.endDate);
                const originalEndDate = new Date(originalItem.endDate);
                if (newEndDate < originalEndDate) {
                    errors.endDate = "You cannot shorten the auction duration once bidding has started";
                }
            } else {
                // For auctions without bids, just ensure end date is in the future
                const selectedDate = new Date(auctionItem.endDate);
                const now = new Date();
                if (selectedDate <= now) {
                    errors.endDate = "End date must be in the future";
                }
            }
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        try {
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("jwt="))
                ?.split("=")[1];

            if (!token) {
                setError("You must be logged in to update an auction");
                navigate("/login");
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            await axios.put(
                `${apiUrl}/api/auctions/${id}`, 
                {
                    title: auctionItem.title,
                    description: auctionItem.description,
                    startingBid: parseFloat(auctionItem.startingBid),
                    endDate: new Date(auctionItem.endDate).toISOString()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            navigate(`/auction/${id}`, { state: { message: "Auction updated successfully!" } });
        } catch (err) {
            console.error("Error updating auction item:", err);
            if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
                navigate("/login");
            } else if (err.response?.status === 403) {
                setError("You don't have permission to edit this auction");
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Failed to update auction. Please try again.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-gray-900 text-white rounded-lg shadow-lg flex justify-center">
                <div className="w-12 h-12 border-t-4 border-b-4 border-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error && !auctionItem._id) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-8 bg-gray-900 text-white rounded-lg shadow-lg">
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
                <div className="flex justify-center">
                    <Link 
                        to="/auctions" 
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800"
                    >
                        Browse Auctions
                    </Link>
                </div>
            </div>
        );
    }

    // Set minimum end date to tomorrow or original date if it exists
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minEndDate = originalItem ? 
        new Date(Math.min(tomorrow, new Date(originalItem.endDate))).toISOString().slice(0, 16) : 
        tomorrow.toISOString().slice(0, 16);

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-gray-900 text-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6">Edit Auction Item</h2>
            
            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-md mb-6">
                    <p className="text-red-400">{error}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-lg mb-2">
                        Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={auctionItem.title}
                        onChange={handleChange}
                        className={`w-full p-2 bg-gray-800 border ${
                            validationErrors.title ? "border-red-500" : "border-gray-700"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        disabled={submitting}
                    />
                    {validationErrors.title && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
                    )}
                </div>
                
                <div>
                    <label htmlFor="description" className="block text-lg mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={auctionItem.description}
                        onChange={handleChange}
                        className={`w-full p-2 bg-gray-800 border ${
                            validationErrors.description ? "border-red-500" : "border-gray-700"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        rows="4"
                        disabled={submitting}
                    />
                    {validationErrors.description && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
                    )}
                </div>
                
                <div>
                    <label htmlFor="startingBid" className="block text-lg mb-2">
                        Starting Bid
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                        <input
                            type="number"
                            id="startingBid"
                            name="startingBid"
                            value={auctionItem.startingBid}
                            onChange={handleChange}
                            className={`w-full pl-8 p-2 bg-gray-800 border ${
                                validationErrors.startingBid ? "border-red-500" : "border-gray-700"
                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            min="0.01"
                            step="0.01"
                            disabled={submitting || (originalItem && originalItem.hasBids)}
                        />
                    </div>
                    {validationErrors.startingBid && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.startingBid}</p>
                    )}
                    {originalItem && originalItem.hasBids && (
                        <p className="mt-1 text-sm text-yellow-500">
                            Starting bid cannot be changed once bidding has started
                        </p>
                    )}
                </div>
                
                <div>
                    <label htmlFor="endDate" className="block text-lg mb-2">
                        End Date
                    </label>
                    <input
                        type="datetime-local"
                        id="endDate"
                        name="endDate"
                        value={auctionItem.endDate}
                        onChange={handleChange}
                        className={`w-full p-2 bg-gray-800 border ${
                            validationErrors.endDate ? "border-red-500" : "border-gray-700"
                        } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        min={minEndDate}
                        disabled={submitting}
                    />
                    {validationErrors.endDate && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.endDate}</p>
                    )}
                    {originalItem && originalItem.hasBids && (
                        <p className="mt-1 text-sm text-yellow-500">
                            You can extend the auction end date, but cannot shorten it once bidding has started
                        </p>
                    )}
                </div>
                
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className={`flex-1 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={submitting}
                    >
                        {submitting ? "Updating..." : "Update Auction Item"}
                    </button>
                    
                    <Link
                        to={`/auction/${id}`}
                        className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 text-center"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default EditAuctionItem;
