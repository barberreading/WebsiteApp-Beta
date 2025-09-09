const Booking = require('../../models/Booking');

const getStats = async (user) => {
    const baseQuery = { client: { $exists: true, $ne: null } };

    if (user.role === 'staff') {
        baseQuery.staff = user.id;
    } else if (user.role === 'client') {
        delete baseQuery.client;
        baseQuery.client = user.id;
    }

    const upcomingBookings = await Booking.countDocuments({
        ...baseQuery,
        startTime: { $gt: new Date() },
        status: { $ne: 'cancelled' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
        ...baseQuery,
        startTime: { $gte: today, $lt: tomorrow },
        status: { $ne: 'cancelled' }
    });

    const totalBookings = await Booking.countDocuments(baseQuery);

    const totalRevenue = await Booking.aggregate([
        { $match: baseQuery },
        {
            $lookup: {
                from: 'services',
                localField: 'service',
                foreignField: '_id',
                as: 'serviceDoc'
            }
        },
        {
            $unwind: '$serviceDoc'
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$serviceDoc.price' }
            }
        }
    ]);

    return {
        upcomingBookings,
        todayBookings,
        totalBookings,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
    };
};

module.exports = {
    getStats,
};