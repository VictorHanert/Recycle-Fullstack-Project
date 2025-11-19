import { useEffect } from 'react';
import { useAdminStore } from '../../stores';
import { 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Paper,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PercentIcon from '@mui/icons-material/Percent';

// Color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

function Stats() {
  const { stats, statsLoading, statsError, fetchStats } = useAdminStore();

  useEffect(() => {
    fetchStats();
  }, []);

  if (statsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (statsError) {
    return (
      <Box p={4}>
        <Alert severity="error">Error loading statistics: {statsError}</Alert>
      </Box>
    );
  }

  // Prepare chart data
  const productStatusData = [
    { id: 0, value: stats?.active_products || 0, label: 'Active', color: '#00C49F' },
    { id: 1, value: stats?.sold_products || 0, label: 'Sold', color: '#0088FE' },
    { id: 2, value: (stats?.total_products || 0) - (stats?.active_products || 0) - (stats?.sold_products || 0), label: 'Inactive', color: '#FF8042' }
  ].filter(item => item.value > 0);

  // Real category data from backend
  const categoryData = stats?.category_distribution || [];

  // Real monthly trends data
  const monthlyTrendsProducts = stats?.monthly_trends?.products || [];
  const monthlyTrendsSales = stats?.monthly_trends?.sales || [];

  // Format month names for display
  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  };

  // Prepare data for charts
  const months = monthlyTrendsProducts.length > 0 
    ? monthlyTrendsProducts.map(item => formatMonth(item.month))
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  const productsData = monthlyTrendsProducts.length > 0
    ? monthlyTrendsProducts.map(item => item.count)
    : [0, 0, 0, 0, 0, stats?.total_products || 0];
  
  // Align sales data with products data by month
  const salesDataMap = new Map(monthlyTrendsSales.map(item => [item.month, item]));
  const salesData = monthlyTrendsProducts.length > 0
    ? monthlyTrendsProducts.map(item => {
        const saleData = salesDataMap.get(item.month);
        return saleData ? saleData.count : 0;
      })
    : [0, 0, 0, 0, 0, stats?.sold_products || 0];
  
  const revenueData = monthlyTrendsProducts.length > 0
    ? monthlyTrendsProducts.map(item => {
        const saleData = salesDataMap.get(item.month);
        return saleData ? Math.round(saleData.revenue / 1000) : 0; // Convert to thousands
      })
    : [0, 0, 0, 0, 0, Math.round((stats?.revenue_from_sold_products || 0) / 1000)];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <Card elevation={3} sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary" mt={1}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box 
            sx={{ 
              backgroundColor: `${color}20`, 
              borderRadius: '50%', 
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon sx={{ fontSize: 32, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Platform Statistics
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Comprehensive overview of your marketplace performance
        </Typography>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Users"
            value={stats?.total_users || 0}
            icon={PeopleIcon}
            color="#0088FE"
            subtitle="Registered users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Products"
            value={stats?.total_products || 0}
            icon={InventoryIcon}
            color="#00C49F"
            subtitle="All listings"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Products"
            value={stats?.active_products || 0}
            icon={TrendingUpIcon}
            color="#FFBB28"
            subtitle="Currently listed"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Sold Products"
            value={stats?.sold_products || 0}
            icon={ShoppingCartIcon}
            color="#FF8042"
            subtitle="Completed sales"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Conversion Rate"
            value={`${stats?.conversion_rate || 0}%`}
            icon={PercentIcon}
            color="#8884D8"
            subtitle="Sales / Total"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Revenue"
            value={`${(stats?.revenue_from_sold_products || 0).toLocaleString()} kr`}
            icon={AttachMoneyIcon}
            color="#82ca9d"
            subtitle="From sold items"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Product Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Product Status Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height="300px">
              <PieChart
                series={[
                  {
                    data: productStatusData,
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                  },
                ]}
                height={300}
                slotProps={{
                  legend: {
                    direction: 'row',
                    position: { vertical: 'bottom', horizontal: 'middle' },
                    padding: 0,
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Products by Category
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height="300px">
              <BarChart
                xAxis={[{ scaleType: 'band', data: categoryData.map(d => d.category) }]}
                series={[{ data: categoryData.map(d => d.count), color: '#0088FE' }]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Revenue Trend */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Revenue Trend (x1000 kr)
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height="300px">
              <LineChart
                xAxis={[{ scaleType: 'point', data: months }]}
                series={[
                  {
                    data: revenueData,
                    area: true,
                    color: '#82ca9d',
                    showMark: true,
                  },
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Sales & Product Growth */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '400px' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Products vs Sales Growth
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box height="300px">
              <LineChart
                xAxis={[{ scaleType: 'point', data: months }]}
                series={[
                  {
                    data: productsData,
                    label: 'Total Products',
                    color: '#0088FE',
                    showMark: true,
                  },
                  {
                    data: salesData,
                    label: 'Sales',
                    color: '#00C49F',
                    showMark: true,
                  },
                ]}
                height={300}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Performance Summary */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Performance Summary
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {stats?.average_price ? `${stats.average_price.toLocaleString()} kr` : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Product Price
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h5" color="secondary" fontWeight="bold">
                    {stats?.total_products ? Math.round(stats.total_products / (stats.total_users || 1)) : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Products per User
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h5" color="success.main" fontWeight="bold">
                    {stats?.sold_products && stats?.total_users ? 
                      Math.round((stats.sold_products / stats.total_users) * 100) / 100 : 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sales per User
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2}>
                  <Typography variant="h5" color="warning.main" fontWeight="bold">
                    {stats?.sold_products && stats?.revenue_from_sold_products ? 
                      Math.round(stats.revenue_from_sold_products / stats.sold_products).toLocaleString() + ' kr' : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg. Sold Price
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Stats;