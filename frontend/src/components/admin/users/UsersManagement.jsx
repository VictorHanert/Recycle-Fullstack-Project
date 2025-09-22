import { useState, useEffect } from 'react';
import { usersAPI } from '../../../api/admin';
import { useAlert } from '../../../hooks/useAlert';
import Alert from '../../shared/Alert';
import UsersTable from './UsersTable';
import UserFormModal from './UserFormModal';

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    phone: '',
    password: '',
    is_active: true,
    is_admin: false
  });
  const [formLoading, setFormLoading] = useState(false);

  const { alertState, showAlert, showConfirm, closeAlert } = useAlert();

  // Fetch users
  const fetchUsers = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, size: 15 };
      if (search) params.search = search;

      const response = await usersAPI.getAllUsers(params);
      setUsers(response.users);
      setTotalPages(response.total_pages);
      setCurrentPage(response.page);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1, searchTerm);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await usersAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ username: '', email: '', full_name: '', phone: '', password: '', is_active: true, is_admin: false });
      fetchUsers(currentPage);
    } catch (err) {
      console.error('Failed to create user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      const updateData = { ...formData };
      
      // Remove password if it's empty (don't update password)
      if (!updateData.password.trim()) {
        delete updateData.password;
      }
      
      await usersAPI.update(selectedUser.id, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ username: '', email: '', full_name: '', phone: '', password: '', is_active: true, is_admin: false });
      fetchUsers(currentPage);
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err.message || 'Failed to update user');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    const performDelete = async () => {
      try {
        await usersAPI.delete(userId);
        fetchUsers(currentPage);
      } catch (err) {
        console.error('Failed to delete user:', err);
        setError(err.message || 'Failed to delete user');
      }
    };
    showConfirm('Confirm Delete', 'Are you sure you want to permanently delete this user? This action cannot be undone and will remove all user data including their products.', performDelete);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      full_name: user.full_name || '',
      phone: user.phone || '',
      password: '', // Don't pre-fill password
      is_active: user.is_active,
      is_admin: user.is_admin || false
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ username: '', email: '', full_name: '', phone: '', password: '', is_active: true, is_admin: false });
    setSelectedUser(null);
  };

  return (
    <div className="px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New User
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700"
          >
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchUsers(1, '');
              }}
              className="bg-white text-blue-600 border border-blue-600 px-2 py-1 rounded hover:bg-red-700"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Users Table */}
      <UsersTable
        users={users}
        onEdit={openEditModal}
        onDelete={handleDeleteUser}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => fetchUsers(page, searchTerm)}
      />

      {/* Create User Modal */}
      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreateUser}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        isEdit={false}
      />

      {/* Edit User Modal */}
      <UserFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onSubmit={handleEditUser}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        isEdit={true}
      />
      
      {/* Alert Component */}
      <Alert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.type === 'error' ? 'OK' : 'Delete'}
        showCancel={alertState.type !== 'error'}
      />
    </div>
  );
}

export default UsersManagement;