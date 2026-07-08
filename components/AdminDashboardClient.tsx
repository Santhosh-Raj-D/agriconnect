'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleUserBlockStatus } from '@/lib/actions/adminActions';
import { logout } from '@/lib/actions/authActions';
import Link from 'next/link';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'FARMER' | 'BUYER';
  farmName: string | null;
  isBlocked: boolean;
  address: string | null;
}

interface CategoryMetric {
  category: string;
  volume: number;
  revenue: number;
}

interface BuyerMetric {
  name: string;
  email: string;
  orderCount: number;
}

interface AdminDashboardClientProps {
  users: ManagedUser[];
  categoryMetrics: CategoryMetric[];
  buyerMetrics: BuyerMetric[];
  counts: {
    farmers: number;
    buyers: number;
    products: number;
    orders: number;
  };
}

export default function AdminDashboardClient({
  users,
  categoryMetrics,
  buyerMetrics,
  counts,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'users' | 'analytics'>('users');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FARMER' | 'BUYER'>('ALL');
  const [search, setSearch] = useState('');

  // Handle blocking user
  const handleToggleBlock = (userId: string) => {
    if (!confirm('Are you sure you want to change this user\'s access status?')) return;
    startTransition(async () => {
      const res = await toggleUserBlockStatus(userId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || 'Failed to update user block status.');
      }
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  // Filters
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.farmName && u.farmName.toLowerCase().includes(search.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  // Chart Calculations
  const maxVolume = Math.max(...categoryMetrics.map((c) => c.volume), 1);
  const maxRevenue = Math.max(...categoryMetrics.map((c) => c.revenue), 1);
  const maxBuyerOrders = Math.max(...buyerMetrics.map((b) => b.orderCount), 1);

  return (
    <div className="min-h-screen bg-forest text-cream font-sans flex flex-col">
      {/* Header */}
      <header className="bg-canopy border-b border-solid border-fern/25 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="nav-logo text-xl font-serif text-cream flex items-center gap-2">
          <span className="logo-dot" /> Admin Operations
        </Link>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link href="/store" className="text-xs text-gold hover:underline font-mono uppercase tracking-wider">
            Marketplace
          </Link>
          <span className="text-xs text-mist hidden sm:inline">
            Role: <strong className="text-cream">Platform Administrator</strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs border border-solid border-fern/60 text-mist hover:text-cream px-3 py-1.5 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 flex-1">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-canopy border border-solid border-fern/20 p-5 rounded-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-mist">Farmers</span>
            <div className="text-3xl font-serif text-gold mt-2">{counts.farmers}</div>
          </div>

          <div className="bg-canopy border border-solid border-fern/20 p-5 rounded-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-mist">Buyers</span>
            <div className="text-3xl font-serif text-gold mt-2">{counts.buyers}</div>
          </div>

          <div className="bg-canopy border border-solid border-fern/20 p-5 rounded-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-mist">Active Listings</span>
            <div className="text-3xl font-serif text-gold mt-2">{counts.products}</div>
          </div>

          <div className="bg-canopy border border-solid border-fern/20 p-5 rounded-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-mist">Total Orders</span>
            <div className="text-3xl font-serif text-gold mt-2">{counts.orders}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-solid border-fern/20 gap-4 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-gold text-gold'
                : 'border-transparent text-mist hover:text-cream'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-4 px-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-all ${
              activeTab === 'analytics'
                ? 'border-gold text-gold'
                : 'border-transparent text-mist hover:text-cream'
            }`}
          >
            Analytics Dashboard
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-serif text-xl">Platform Directory</h2>

              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search user name or email..."
                  className="bg-canopy border border-solid border-fern/40 focus:border-gold outline-none text-xs px-4 py-2.5 text-cream w-full sm:w-[240px]"
                />

                <div className="flex flex-wrap border border-solid border-fern/40">
                  {(['ALL', 'FARMER', 'BUYER'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`text-[10px] tracking-wider uppercase font-mono px-3 py-2 transition-colors ${
                        roleFilter === role
                          ? 'bg-fern text-cream'
                          : 'bg-transparent text-mist hover:text-cream'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-canopy border border-solid border-fern/20 rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-forest border-b border-solid border-fern/20 font-mono uppercase tracking-widest text-mist">
                      <th className="p-4">User Name</th>
                      <th className="p-4">Contact Email</th>
                      <th className="p-4">Account Type</th>
                      <th className="p-4">Specialization / Farm</th>
                      <th className="p-4">Location</th>
                      <th className="p-4 text-right">Access State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-solid divide-fern/10">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-forest/40 transition-colors">
                        <td className="p-4 font-medium text-cream">{u.name}</td>
                        <td className="p-4 font-mono text-mist">{u.email}</td>
                        <td className="p-4">
                          <span
                            className={`text-[9px] tracking-wider uppercase font-mono px-2 py-0.5 border border-solid rounded-sm ${
                              u.role === 'FARMER'
                                ? 'bg-gold/10 border-gold/30 text-gold'
                                : 'bg-mist/10 border-mist/30 text-mist'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-mist">{u.farmName || '—'}</td>
                        <td className="p-4 text-mist">{u.address || '—'}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleToggleBlock(u.id)}
                            disabled={isPending}
                            className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                              u.isBlocked
                                ? 'bg-fern text-cream hover:bg-gold hover:text-forest'
                                : 'border border-solid border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-900/40'
                            }`}
                          >
                            {u.isBlocked ? 'Unblock User' : 'Block User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Sales Trends Chart */}
            <div className="bg-canopy border border-solid border-fern/20 p-6 rounded-sm space-y-6">
              <div>
                <h3 className="font-serif text-lg">Product Sales Volume by Category</h3>
                <p className="text-[10px] text-mist mt-1">Total items sold directly to consumers.</p>
              </div>

              {/* Vertical CSS Bar Chart */}
              <div className="h-[240px] flex items-end justify-around gap-4 pt-8 border-b border-solid border-fern/30 pb-2 relative">
                {/* Horizontal reference lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                  <div className="border-b border-solid border-white w-full" />
                  <div className="border-b border-solid border-white w-full" />
                  <div className="border-b border-solid border-white w-full" />
                  <div className="border-b border-solid border-white w-full" />
                </div>

                {categoryMetrics.map((m) => {
                  const volPercent = (m.volume / maxVolume) * 100;
                  const revPercent = (m.revenue / maxRevenue) * 100;
                  return (
                    <div key={m.category} className="flex flex-col items-center gap-3 w-1/4 group relative">
                      {/* Tooltip */}
                      <div className="absolute top-[-50px] bg-canopy border border-solid border-fern px-3 py-1.5 rounded-sm text-[10px] font-mono text-center hidden group-hover:block z-10 shadow-xl min-w-[100px]">
                        <div>Qty: {m.volume} items</div>
                        <div className="text-gold mt-0.5">₹{m.revenue.toLocaleString('en-IN')}</div>
                      </div>

                      <div className="flex items-end gap-2 h-[150px] w-full justify-center">
                        {/* Volume Bar */}
                        <div
                          style={{ height: `${volPercent}%` }}
                          className="w-4 bg-mist transition-all duration-1000 origin-bottom"
                          title={`Volume: ${m.volume}`}
                        />
                        {/* Revenue Bar */}
                        <div
                          style={{ height: `${revPercent}%` }}
                          className="w-4 bg-gold transition-all duration-1000 origin-bottom"
                          title={`Revenue: ₹${m.revenue}`}
                        />
                      </div>

                      <div className="text-[10px] tracking-wider uppercase font-mono text-center text-mist">
                        {m.category.toLowerCase()}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-6 text-[10px] font-mono uppercase tracking-wider pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-mist" />
                  <span>Sales Volume (Quantity)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-gold" />
                  <span>Gross Revenue (₹)</span>
                </div>
              </div>
            </div>

            {/* Buyer Activity Frequency Chart */}
            <div className="bg-canopy border border-solid border-fern/20 p-6 rounded-sm space-y-6">
              <div>
                <h3 className="font-serif text-lg">Top Active Buyers</h3>
                <p className="text-[10px] text-mist mt-1">Customers with highest order placement frequency.</p>
              </div>

              {/* Horizontal CSS Progress Bars */}
              <div className="space-y-6 pt-4">
                {buyerMetrics.length === 0 ? (
                  <div className="text-center py-12 text-xs text-mist">No transaction logs available.</div>
                ) : (
                  buyerMetrics.map((buyer) => {
                    const widthPercent = (buyer.orderCount / maxBuyerOrders) * 100;
                    return (
                      <div key={buyer.email} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-medium text-cream">{buyer.name}</span>
                            <span className="text-[10px] text-mist font-mono ml-2">({buyer.email})</span>
                          </div>
                          <span className="font-mono text-gold font-semibold">
                            {buyer.orderCount} {buyer.orderCount === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                        {/* Outer Bar */}
                        <div className="w-full bg-forest h-2.5 rounded-full overflow-hidden border border-solid border-fern/20">
                          {/* Inner Fill */}
                          <div
                            style={{ width: `${widthPercent}%` }}
                            className="bg-gold h-full rounded-full transition-all duration-1000"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
