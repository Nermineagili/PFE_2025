const User = require('../models/user');
const Claim = require('../models/claim');
const Contract = require('../models/Contract');

// Get all users (excluding admins)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

// Get user by ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
};

// Get all users with contracts 
const getAllUsersWithContracts = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password')
            .populate('contracts');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users with contracts' });
    }
};

// Get users with non-empty contracts
const getUsersWithContractsOnly = async (req, res) => {
    try {
        const users = await User.find({
            role: { $ne: 'admin' },
            contracts: { $exists: true, $not: { $size: 0 } }
        })
            .select('-password')
            .populate('contracts');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users with contracts' });
    }
};

// Get all claims
const getAllClaims = async (req, res) => {
    try {
        const claims = await Claim.find().populate("userId", "name email");
        res.json(claims);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claims" });
    }
};

// Get claim by ID
const getClaimById = async (req, res) => {
    try {
        const claim = await Claim.findById(req.params.id).populate("userId", "name email");
        if (!claim) return res.status(404).json({ error: "Claim not found" });
        res.json(claim);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch claim" });
    }
};

// Get all contracts
const getAllContracts = async (req, res) => {
    try {
        const contracts = await Contract.find().populate('userId', 'name email');
        res.json(contracts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
};

// Get dashboard summary statistics with growth percentages
const getDashboardStats = async (req, res) => {
    try {
        // Get date ranges
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const monthBeforeLastStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const monthBeforeLastEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

        // Fetch all-time, last month, and month-before-last stats in parallel
        const [
            totalUsersAllTime,
            totalUsersLastMonth,
            totalUsersMonthBeforeLast,
            totalClaimsAllTime,
            totalClaimsLastMonth,
            totalClaimsMonthBeforeLast,
            totalContractsAllTime,
            totalContractsLastMonth,
            totalContractsMonthBeforeLast,
            pendingClaims,
            revenueAllTime,
            revenueLastMonth,
            revenueMonthBeforeLast,
        ] = await Promise.all([
            // All-time users
            User.countDocuments({ role: { $ne: 'admin' } }),
            // Last month users
            User.countDocuments({
                role: { $ne: 'admin' },
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            // Month before last users
            User.countDocuments({
                role: { $ne: 'admin' },
                createdAt: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
            }),
            // All-time claims
            Claim.countDocuments(),
            // Last month claims
            Claim.countDocuments({
                createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            // Month before last claims
            Claim.countDocuments({
                createdAt: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
            }),
            // All-time contracts
            Contract.countDocuments(),
            // Last month contracts
            Contract.countDocuments({
                startDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
            }),
            // Month before last contracts
            Contract.countDocuments({
                startDate: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
            }),
            // Pending claims (all-time)
            Claim.countDocuments({ status: 'pending' }),
            // All-time revenue
            Contract.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: null, totalRevenue: { $sum: '$premiumAmount' } } },
            ]),
            // Last month revenue
            Contract.aggregate([
                {
                    $match: {
                        status: 'active',
                        startDate: { $gte: lastMonthStart, $lte: lastMonthEnd },
                    },
                },
                { $group: { _id: null, totalRevenue: { $sum: '$premiumAmount' } } },
            ]),
            // Month before last revenue
            Contract.aggregate([
                {
                    $match: {
                        status: 'active',
                        startDate: { $gte: monthBeforeLastStart, $lte: monthBeforeLastEnd },
                    },
                },
                { $group: { _id: null, totalRevenue: { $sum: '$premiumAmount' } } },
            ]),
        ]);

        // Calculate growth percentages (last month vs. month before last)
        const calculateGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0; // Handle division by zero
            return ((current - previous) / previous) * 100;
        };

        const totalUsersGrowth = calculateGrowth(totalUsersLastMonth, totalUsersMonthBeforeLast);
        const totalClaimsGrowth = calculateGrowth(totalClaimsLastMonth, totalClaimsMonthBeforeLast);
        const totalContractsGrowth = calculateGrowth(totalContractsLastMonth, totalContractsMonthBeforeLast);
        const revenueLastMonthValue = revenueLastMonth[0]?.totalRevenue || 0;
        const revenueMonthBeforeLastValue = revenueMonthBeforeLast[0]?.totalRevenue || 0;
        const revenueGrowth = calculateGrowth(revenueLastMonthValue, revenueMonthBeforeLastValue);

        res.json({
            totalUsersAllTime,
            totalUsersLastMonth,
            totalClaimsAllTime,
            totalClaimsLastMonth,
            totalContractsAllTime,
            totalContractsLastMonth,
            pendingClaims,
            revenueAllTime: revenueAllTime[0]?.totalRevenue || 0,
            revenueLastMonth: revenueLastMonthValue,
            totalUsersGrowth: Number(totalUsersGrowth.toFixed(2)),
            totalClaimsGrowth: Number(totalClaimsGrowth.toFixed(2)),
            totalContractsGrowth: Number(totalContractsGrowth.toFixed(2)),
            revenueGrowth: Number(revenueGrowth.toFixed(2)),
        });
    } catch (err) {
        console.error('Error in getDashboardStats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics', details: err.message });
    }
};


// Get policy type distribution for pie chart
const getPolicyTypeDistribution = async (req, res) => {
    try {
        const policyTypes = await Contract.aggregate([
            // Ensure policyType is a valid string and in enum
            {
                $match: {
                    policyType: {
                        $exists: true,
                        $ne: null,
                        $type: 'string',
                        $in: ['santé', 'voyage', 'automobile', 'responsabilité civile', 'habitation', 'professionnelle', 'transport']
                    }
                }
            },
            // Group by policyType and count
            { $group: { _id: { $toString: '$policyType' }, value: { $sum: 1 } } },
            // Format output without capitalization to avoid encoding issues
            {
                $project: {
                    name: '$_id',
                    value: 1,
                    _id: 0
                }
            }
        ]);

        res.json(policyTypes.length > 0 ? policyTypes : []);
    } catch (err) {
        console.error('Error in getPolicyTypeDistribution:', {
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        res.status(500).json({ error: 'Failed to fetch policy type distribution', details: err.message });
    }
};

// Get contract activity by month for bar chart
const getContractActivityByMonth = async (req, res) => {
    try {
        const monthNames = [
            'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
            'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
        ];
        const contracts = await Contract.find({}, 'startDate');
        const monthData = {};

        // Initialize month data
        monthNames.forEach(month => {
            monthData[month] = 0;
        });

        // Count contracts by month
        contracts.forEach(contract => {
            const startDate = new Date(contract.startDate);
            const monthName = monthNames[startDate.getMonth()];
            monthData[monthName] = (monthData[monthName] || 0) + 1;
        });

        // Format response
        const activityData = monthNames.map(month => ({
            name: month,
            value: monthData[month]
        }));

        res.json(activityData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch contract activity data' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getAllUsersWithContracts,
    getUsersWithContractsOnly,
    getAllClaims,
    getClaimById,
    getAllContracts,
    getDashboardStats,
    getPolicyTypeDistribution,
    getContractActivityByMonth
};