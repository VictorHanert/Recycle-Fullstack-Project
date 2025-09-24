import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { useAlert } from '../../hooks/useAlert';
import Alert from '../shared/Alert';

function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ city: '', postcode: '' });
  const { alertState, showConfirm, closeAlert } = useAlert();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await adminAPI.getLocations();
      setLocations(res);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createLocation(formData);
      setFormData({ city: '', postcode: '' });
      fetchLocations();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await adminAPI.updateLocation(id, formData);
      setEditing(null);
      setFormData({ city: '', postcode: '' });
      fetchLocations();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    const performDelete = async () => {
      try {
        await adminAPI.deleteLocation(id);
        fetchLocations();
      } catch (err) {
        console.error('Failed to delete location:', err);
        setError(err.message || 'Failed to delete location');
      }
    };
    showConfirm('Confirm Delete', 'Are you sure you want to delete this location?', performDelete);
  };

  const startEdit = (location) => {
    setEditing(location.id);
    setFormData({ city: location.city, postcode: location.postcode });
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormData({ city: '', postcode: '' });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Locations</h1>
      <Alert alertState={alertState} closeAlert={closeAlert} />
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Location</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Postcode"
            value={formData.postcode}
            onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
            required
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">City</th>
              <th className="text-left p-2">Postcode</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-t">
                {editing === location.id ? (
                  <>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={formData.postcode}
                        onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                        className="border p-1 rounded"
                      />
                    </td>
                    <td className="px-2 py-1 flex gap-2">
                      <button onClick={() => handleUpdate(location.id)} className="bg-blue-500 text-white w-20 px-2 py-1 rounded">Save</button>
                      <button onClick={cancelEdit} className="bg-gray-500 text-white w-20 px-2 py-1 rounded">Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1">{location.city}</td>
                    <td className="px-2 py-1">{location.postcode}</td>
                    <td className="px-2 py-1 flex gap-2">
                      <button onClick={() => startEdit(location)} className="border border-blue-500 text-blue-500 w-20 px-2 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(location.id)} className="border border-red-500 text-red-500 w-20 px-2 py-1 rounded">Delete</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Alert Component */}
      <Alert
        isOpen={alertState.isOpen}
        onClose={closeAlert}
        onConfirm={alertState.onConfirm}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
      />

    </div>
  );
}

export default Locations;