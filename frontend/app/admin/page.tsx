'use client';

import { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, ListVideo, Users } from 'lucide-react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    courses: 0,
    lessons: 0,
    enrollments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching dashboard stats...');
        const response = await api.get('/admin/dashboard');
        console.log('Dashboard stats response:', response);
        console.log('Response data:', response.data);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Admin dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Users"
          value={stats.users}
          icon={Users}
        />
        <DashboardCard
          title="Total Courses"
          value={stats.courses}
          icon={BookOpen}
        />
        <DashboardCard
          title="Total Lessons"
          value={stats.lessons}
          icon={ListVideo}
        />
        <DashboardCard
          title="Total Enrollments"
          value={stats.enrollments}
          icon={GraduationCap}
        />
      </div>
    </div>
  );
}
