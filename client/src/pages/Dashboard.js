import React from 'react';
import Sidebar from '../components/layouts/PageLayout';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  ClipboardList,
  FileText,
  DollarSign,
  UserPlus,
  FileText as LettersIcon,
  LogOut
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <span className="mr-2">🏠</span> },
  { path: '/sessions', label: 'Sessions', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { path: '/student-input', label: 'Student Input', icon: <Users className="w-4 h-4 mr-2" /> },
  { path: '/assign-qpsetter', label: 'Assign QP Setter', icon: <UserPlus className="w-4 h-4 mr-2" /> },
  { path: '/dashboard/seating-arrangement', label: 'Seating Arrangement', icon: <ClipboardList className="w-4 h-4 mr-2" /> },
  { path: '/duties', label: 'Duties', icon: <FileText className="w-4 h-4 mr-2" /> },
  { path: '/claims', label: 'Claims', icon: <DollarSign className="w-4 h-4 mr-2" /> },
  { path: '/letters', label: 'Letters', icon: <LettersIcon className="w-4 h-4 mr-2" /> },
  { path: '/logout', label: 'Logout', icon: <LogOut className="w-4 h-4 mr-2" /> },
];

const Dashboard = () => {
  const modules = [
    {
      title: 'Student Input',
      description: 'Manage student information and course registrations',
      icon: Users,
      path: '/student-input',
      color: 'bg-blue-500'
    },
    {
      title: 'Sessions',
      description: 'View and manage examination sessions',
      icon: Calendar,
      path: '/sessions',
      color: 'bg-green-500'
    },
    {
      title: 'Seating Arrangement',
      description: 'Generate and manage seating arrangements',
      icon: ClipboardList,
      path: '/dashboard/seating-arrangement',
      color: 'bg-purple-500'
    },
    {
      title: 'Duties',
      description: 'Assign and manage invigilation duties',
      icon: FileText,
      path: '/duties',
      color: 'bg-orange-500'
    },
    {
      title: 'Claims',
      description: 'Process and manage faculty claims',
      icon: DollarSign,
      path: '/claims',
      color: 'bg-red-500'
    },
    {
      title: 'Assign QP Setter',
      description: 'Assign faculty to set question papers',
      icon: UserPlus,
      path: '/assign-qpsetter',
      color: 'bg-cyan-600'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <Sidebar menuItems={menuItems} theme="bg-white text-gray-900" activeClass="bg-blue-100 text-blue-700">
      <div className="min-h-screen bg-[#f9f9f9] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to PG Examinations Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Manage examinations, seating arrangements, and faculty duties efficiently
            </p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {modules.map((module, index) => (
              <motion.div
                key={module.path}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to={module.path} className="block h-full">
                  <div className="card h-full hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${module.color} text-white`}>
                        <module.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {module.title}
                        </h3>
                        <p className="text-gray-600">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Sidebar>
  );
};

export default Dashboard;
