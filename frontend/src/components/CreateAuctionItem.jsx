import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import auth context

const CreateAuctionItem = () => {
    const { isLoggedIn } = useAuth(); // Use auth context
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startingBid, setStartingBid] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const navigate = useNavigate();

    // Set minimum end date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minEndDate = tomorrow.toISOString().slice(0, 16);

    useEffect(() => {
        // Redirect if not logged in
        if (!isLoggedIn) {
            navigate("/login");
        }
    }, [isLoggedIn, navigate]);

    const validateForm = () => {
        const errors = {};
        
        if (!title.trim()) {
            errors.title = "Title is required";
        } else if (title.length < 3) {
            errors.title = "Title must be at least 3 characters";
        }
        
        if (!description.trim()) {
            errors.description = "Description is required";
        } else if (description.length < 10) {
            errors.description = "Description must be at least 10 characters";
        }
        
        if (!startingBid) {
            errors.startingBid = "Starting bid is required";
        } else if (parseFloat(startingBid) <= 0) {
            errors.startingBid = "Starting bid must be greater than 0";
        }
        
        if (!endDate) {
            errors.endDate = "End date is required";
        } else {
            const selectedDate = new Date(endDate);
            const now = new Date();
            if (selectedDate <= now) {
                errors.endDate = "End date must be in the future";
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
        
        setIsSubmitting(true);
        setError("");
        
        const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("jwt="))
            ?.split("=")[1];
            
        if (!token) {
            setError("You must be logged in to create an auction");
            setIsSubmitting(false);
            navigate("/login");
            return;
        }
        
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
            await axios.post(
                `${apiUrl}/api/auctions`,
                { 
                    title, 
                    description, 
                    startingBid: parseFloat(startingBid), 
                    endDate: new Date(endDate).toISOString() 
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            
            // Success - redirect to profile
            navigate("/profile", { state: { message: "Auction created successfully!" } });
        } catch (err) {
            console.error("Error creating auction:", err);
            if (err.response?.status === 401) {
                setError("Your session has expired. Please log in again.");
                navigate("/login");
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Failed to create auction. Please try again.");
            }
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-gray-300">
            <div className="max-w-2xl mx-auto">
                <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
                    <div className="p-6 sm:p-10">
                        <h2 className="text-3xl font-extrabold text-white mb-6">
                            Create Auction
                        </h2>
                        
                        {error && (
                            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-md">
                                <p className="text-red-400">{error}</p>
                            </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label
                                    htmlFor="title"
                                    className="block text-lg font-medium text-gray-300 mb-1"
                                >
                                    Title
                                </label>
                                <input
                                    id="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border ${
                                        validationErrors.title ? "border-red-500" : "border-gray-600"
                                    } rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    required
                                    disabled={isSubmitting}
                                />
                                {validationErrors.title && (
                                    <p className="mt-1 text-sm text-red-500">{validationErrors.title}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label
                                    htmlFor="description"
                                    className="block text-lg font-medium text-gray-300 mb-1"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border ${
                                        validationErrors.description ? "border-red-500" : "border-gray-600"
                                    } rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    rows="4"
                                    required
                                    disabled={isSubmitting}
                                />
                                {validationErrors.description && (
                                    <p className="mt-1 text-sm text-red-500">{validationErrors.description}</p>
                                )}
                            </div>
                            
                            <div className="mb-4">
                                <label
                                    htmlFor="startingBid"
                                    className="block text-lg font-medium text-gray-300 mb-1"
                                >
                                    Starting Bid ($)
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                                    <input
                                        id="startingBid"
                                        type="number"
                                        value={startingBid}
                                        onChange={(e) => setStartingBid(e.target.value)}
                                        className={`w-full pl-8 pr-3 py-2 bg-gray-700 border ${
                                            validationErrors.startingBid ? "border-red-500" : "border-gray-600"
                                        } rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                        min="0.01"
                                        step="0.01"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {validationErrors.startingBid && (
                                    <p className="mt-1 text-sm text-red-500">{validationErrors.startingBid}</p>
                                )}
                            </div>
                            
                            <div className="mb-6">
                                <label
                                    htmlFor="endDate"
                                    className="block text-lg font-medium text-gray-300 mb-1"
                                >
                                    End Date
                                </label>
                                <input
                                    id="endDate"
                                    type="datetime-local"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className={`w-full px-3 py-2 bg-gray-700 border ${
                                        validationErrors.endDate ? "border-red-500" : "border-gray-600"
                                    } rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                    min={minEndDate}
                                    required
                                    disabled={isSubmitting}
                                />
                                {validationErrors.endDate && (
                                    <p className="mt-1 text-sm text-red-500">{validationErrors.endDate}</p>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    The auction end date must be at least 24 hours in the future
                                </p>
                            </div>
                            
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className={`flex-1 bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 transition-colors duration-300 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                                        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                                    }`}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Creating..." : "Create Auction"}
                                </button>
                                
                                <Link
                                    to="/profile"
                                    className="flex-1 bg-gray-700 text-gray-300 px-6 py-3 rounded-md hover:bg-gray-600 transition-colors duration-300 text-lg font-semibold text-center"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateAuctionItem;
