'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { bicycleTypesAPI } from '@/lib/api'
import { BicycleType } from '@/types'
import { Plus, Edit, Trash2, Bike } from 'lucide-react'

const BicycleTypesAdminPage = () => {
  const { user } = useAuth()
  const [types, setTypes] = useState<BicycleType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<BicycleType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadTypes()
  }, [user])

  const loadTypes = async () => {
    try {
      const response = await bicycleTypesAPI.getAllTypes()
      setTypes(response.data)
    } catch (error) {
      console.error('Failed to load bicycle types:', error)
      alert('Failed to load bicycle types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingType) {
        await bicycleTypesAPI.updateType(editingType._id, formData)
      } else {
        await bicycleTypesAPI.createType(formData)
      }
      setShowForm(false)
      setEditingType(null)
      setFormData({ name: '', description: '', image: '', isActive: true })
      loadTypes()
    } catch (error) {
      console.error('Failed to save bicycle type:', error)
      alert('Failed to save bicycle type')
    }
  }

  const handleEdit = (type: BicycleType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      image: type.image || '',
      isActive: type.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bicycle type?')) return
    try {
      await bicycleTypesAPI.deleteType(id)
      loadTypes()
    } catch (error) {
      console.error('Failed to delete bicycle type:', error)
      alert('Failed to delete bicycle type')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await bicycleTypesAPI.updateType(id, { isActive: !isActive })
      loadTypes()
    } catch (error) {
      console.error('Failed to update type status:', error)
      alert('Failed to update type status')
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access denied</h1>
          <p className="text-gray-600 mt-2">You do not have permission to view this page</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bicycle types management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add type
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingType ? 'Edit type' : 'Add new type'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">
                Active
              </label>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingType ? 'Save' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingType(null)
                  setFormData({ name: '', description: '', image: '', isActive: true })
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {types.map((type) => (
          <div key={type._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Bike className="text-primary-600 mr-3" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${type.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {type.image && (
              <div className="mb-4">
                <img src={type.image} alt={type.name} className="w-full h-48 object-cover rounded-md" />
              </div>
            )}
            {type.description && (
              <p className="text-gray-600 mb-4 line-clamp-2">{type.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>Created: {new Date(type.createdAt).toLocaleDateString('en-US')}</span>
              <span>ID: {type._id.slice(-6)}</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => toggleActive(type._id, type.isActive)}
                className={`flex items-center px-3 py-1 rounded-md transition-colors text-sm ${type.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              >
                {type.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => handleEdit(type)}
                className="flex items-center px-3 py-1 bg-blue-500 text-black rounded-md hover:bg-blue-600 transition-colors text-sm"
              >
                <Edit size={16} className="mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(type._id)}
                className="flex items-center px-3 py-1 bg-red-500 text-black rounded-md hover:bg-red-600 transition-colors text-sm"
              >
                <Trash2 size={16} className="mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {types.length === 0 && (
        <div className="text-center py-12">
          <Bike size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bicycle types found
          </h3>
          <p className="text-gray-600">
            Add the first bicycle type by clicking the "Add type" button
          </p>
        </div>
      )}
    </div>
  )
}

export default BicycleTypesAdminPage