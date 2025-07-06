{userRole === 'Admin' && (
  <>
    <Link to="/student-input" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
      Student Input
    </Link>
    <Link to="/sessions" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
      Sessions
    </Link>
    <Link to="/duties" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
      Duties
    </Link>
    <Link to="/claims" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
      Claims
    </Link>
    <Link to="/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
      Users
    </Link>
  </>
)} 