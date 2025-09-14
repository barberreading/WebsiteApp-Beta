import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';

const StaffDistanceSearch = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [searchParams, setSearchParams] = useState({
        distance: '10',
        bookingDate: '',
        startTime: '',
        endTime: ''
    });
    const [staff, setStaff] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await axiosInstance.get('/users', { params: { role: 'client' } });
                setClients(response.data);
            } catch (err) {
                setError('Failed to fetch clients.');
                logger.error(err);
            }
        };
        fetchClients();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleClientChange = (e) => {
        setSelectedClient(e.target.value);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStaff([]);

        if (!selectedClient) {
            setError('Please select a client.');
            setLoading(false);
            return;
        }

        const client = clients.find(c => c._id === selectedClient);
        if (!client || !client.postcode) {
            setError('Selected client does not have a postcode.');
            setLoading(false);
            return;
        }

        try {
            const postcodeResponse = await fetch(`https://api.postcodes.io/postcodes/${client.postcode}`);
            const postcodeData = await postcodeResponse.json();

            if (postcodeData.status !== 200) {
                throw new Error('Failed to convert postcode to coordinates.');
            }

            const { longitude, latitude } = postcodeData.result;

            const params = {
                longitude,
                latitude,
                distance: searchParams.distance,
                bookingDate: searchParams.bookingDate,
                startTime: searchParams.startTime,
                endTime: searchParams.endTime
            };

            const response = await axiosInstance.get('/staff-search/by-distance', { params });

            if (response.data.length === 0) {
                setError('No staff members found matching the criteria.');
            } else {
                setStaff(response.data);
            }
        } catch (err) {
            setError(err.message || 'An error occurred during the search.');
            logger.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Search Staff by Distance from Client</h2>
            <form onSubmit={handleSearch} className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-gray-700">Client</label>
                        <select
                            id="client"
                            name="client"
                            onChange={handleClientChange}
                            value={selectedClient}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">Select a client</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="distance" className="block text-sm font-medium text-gray-700">Distance (miles)</label>
                        <input
                            type="number"
                            id="distance"
                            name="distance"
                            value={searchParams.distance}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            min="1"
                        />
                    </div>
                    <div>
                        <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            id="bookingDate"
                            name="bookingDate"
                            value={searchParams.bookingDate}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            id="startTime"
                            name="startTime"
                            value={searchParams.startTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            id="endTime"
                            name="endTime"
                            value={searchParams.endTime}
                            onChange={handleInputChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        />
                    </div>
                </div>
                <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            {error && <p className="text-red-500">{error}</p>}

            {staff.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-2">Available Staff</h3>
                    <ul className="divide-y divide-gray-200">
                        {staff.map(s => (
                            <li key={s.staffInfo._id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-semibold">{s.staffInfo.name}</p>
                                    <p className="text-sm text-gray-500">{s.staffInfo.email}</p>
                                </div>
                                <p className="text-md font-medium">{s.distance.toFixed(2)} miles away</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default StaffDistanceSearch;