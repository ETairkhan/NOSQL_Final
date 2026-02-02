'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { bicyclesAPI, bicycleTypesAPI } from '@/lib/api'
import { Bicycle, BicycleType } from '@/types'
import { Plus, Edit, Trash2, Bike, Package, Star } from 'lucide-react'

const BicyclesAdminPage = () => {
  const { user } = useAuth()
  const [bicycles, setBicycles] = useState<Bicycle[]>([])
  const [types, setTypes] = useState<BicycleType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBicycle, setEditingBicycle] = useState<Bicycle | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    type: '',
    images: [''],
    specifications: {
      brand: '',
      frame: {
        material: '',
        size: ''
      },
      wheels: {
        size: '',
        type: ''
      },
      gears: {
        front: '',
        rear: '',
        total: ''
      },
      brakes: {
        type: '',
        brand: ''
      },
      weight: '',
      color: '',
      suspension: {
        front: false,
        rear: false,
        type: ''
      }
    },
    isActive: true
  })

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [bicyclesResponse, typesResponse] = await Promise.all([
        bicyclesAPI.getAllBicycles(),
        bicycleTypesAPI.getAllTypes()
      ])
      setBicycles(bicyclesResponse.data.bicycles || [])
      setTypes(typesResponse.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stock: parseInt(formData.stock),
        type: formData.type || undefined,
        images: formData.images.filter(img => img.trim() !== ''),
        specifications: {
          ...formData.specifications,
          gears: {
            front: formData.specifications.gears.front ? parseInt(formData.specifications.gears.front) : undefined,
            rear: formData.specifications.gears.rear ? parseInt(formData.specifications.gears.rear) : undefined,
            total: formData.specifications.gears.total ? parseInt(formData.specifications.gears.total) : undefined
          }
        }
      }

      if (editingBicycle) {
        await bicyclesAPI.updateBicycle(editingBicycle._id, data)
      } else {
        await bicyclesAPI.createBicycle(data)
      }
      setShowForm(false)
      setEditingBicycle(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save bicycle:', error)
      alert('Failed to save bicycle')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPrice: '',   
      stock: '',
      type: '',
      images: [''],
      specifications: {
        brand: '',
        frame: {
          material: '',
          size: ''
        },
        wheels: {
          size: '',
          type: ''
        },
        gears: {
          front: '',
          rear: '',
          total: ''
        },
        brakes: {
          type: '',
          brand: ''
        },
        weight: '',
        color: '',
        suspension: {
          front: false,
          rear: false,
          type: ''
        }
      },
      isActive: true
    })
  }

  const handleEdit = (bicycle: Bicycle) => {
    setEditingBicycle(bicycle)
    setFormData({
      name: bicycle.name,
      description: bicycle.description || '',
      price: bicycle.price.toString(),
      discountPrice: bicycle.discountPrice?.toString() || '',
      stock: bicycle.stock.toString(),
      type: typeof bicycle.type === 'string' ? bicycle.type : bicycle.type._id,
      images: bicycle.images?.length ? bicycle.images : [''],
      specifications: {
        brand: bicycle.specifications?.brand || '',
        frame: {
          material: bicycle.specifications?.frame?.material || '',
          size: bicycle.specifications?.frame?.size || ''
        },
        wheels: {
          size: bicycle.specifications?.wheels?.size || '',
          type: bicycle.specifications?.wheels?.type || ''
        },
        gears: {
          front: bicycle.specifications?.gears?.front?.toString() || '',
          rear: bicycle.specifications?.gears?.rear?.toString() || '',
          total: bicycle.specifications?.gears?.total?.toString() || ''
        },
        brakes: {
          type: bicycle.specifications?.brakes?.type || '',
          brand: bicycle.specifications?.brakes?.brand || ''
        },
        weight: bicycle.specifications?.weight || '',
        color: bicycle.specifications?.color || '',
        suspension: {
          front: bicycle.specifications?.suspension?.front || false,
          rear: bicycle.specifications?.suspension?.rear || false,
          type: bicycle.specifications?.suspension?.type || ''
        }
      },
      isActive: bicycle.isActive
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bicycle?')) return
    try {
      await bicyclesAPI.deleteBicycle(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete bicycle:', error)
      alert('Failed to delete bicycle')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await bicyclesAPI.updateBicycle(id, { isActive: !isActive })
      loadData()
    } catch (error) {
      console.error('Failed to update bicycle status:', error)
      alert('Failed to update bicycle status')
    }
  }

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, '']
    })
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const removeImageField = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages })
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
        <h1 className="text-3xl font-bold text-gray-900">Bicycle management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add bicycle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {editingBicycle ? 'Edit bicycle' : 'Add new bicycle'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Bicycle type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select type</option>
                  {types.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount price ($)
                </label>
                <input
                  type="number"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock quantity *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="0"
                  required
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
                Images
              </label>
              {formData.images.map((image, index) => (
                <div key={index} className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => updateImage(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Image URL"
                  />
                  {formData.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 bg-red-500 text-black rounded-md hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
              >
                + Add image
              </button>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.brand}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, brand: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.color}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, color: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.weight}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: { ...formData.specifications, weight: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frame material
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.frame.material}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        frame: { ...formData.specifications.frame, material: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frame size
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.frame.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        frame: { ...formData.specifications.frame, size: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wheel size
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.wheels.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        wheels: { ...formData.specifications.wheels, size: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wheel type
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.wheels.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        wheels: { ...formData.specifications.wheels, type: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brakes (type)
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.brakes.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        brakes: { ...formData.specifications.brakes, type: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brakes (brand)
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.brakes.brand}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        brakes: { ...formData.specifications.brakes, brand: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Front gears
                  </label>
                  <input
                    type="number"
                    value={formData.specifications.gears.front}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        gears: { ...formData.specifications.gears, front: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rear gears
                  </label>
                  <input
                    type="number"
                    value={formData.specifications.gears.rear}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        gears: { ...formData.specifications.gears, rear: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total gears
                  </label>
                  <input
                    type="number"
                    value={formData.specifications.gears.total}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        gears: { ...formData.specifications.gears, total: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Suspension type
                  </label>
                  <input
                    type="text"
                    value={formData.specifications.suspension.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      specifications: {
                        ...formData.specifications,
                        suspension: { ...formData.specifications.suspension, type: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specifications.suspension.front}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {
                          ...formData.specifications,
                          suspension: {
                            ...formData.specifications.suspension,
                            front: e.target.checked
                          }
                        }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Front suspension
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.specifications.suspension.rear}
                      onChange={(e) => setFormData({
                        ...formData,
                        specifications: {
                          ...formData.specifications,
                          suspension: {
                            ...formData.specifications.suspension,
                            rear: e.target.checked
                          }
                        }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Rear suspension
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-black rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingBicycle ? 'Save' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingBicycle(null)
                  resetForm()
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
      {Array.isArray(bicycles) && bicycles.length > 0 ? (
         bicycles.map((bicycle) => (
            <div key={bicycle._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
               {bicycle.images && bicycle.images.length > 0 ? (
                  <img
                  src={bicycle.images[0]}
                  alt={bicycle.name}
                  className="w-full h-48 object-cover"
                  />
               ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <Bike size={48} className="text-gray-400" />
                  </div>
               )}
               <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${bicycle.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {bicycle.isActive ? 'Active' : 'Inactive'}
                  </span>
               </div>
            </div>
            <div className="p-4">
               <h3 className="text-lg font-semibold text-gray-900 mb-2">{bicycle.name}</h3>
               <div className="flex items-center mb-2">
                  <p className="text-gray-600 text-sm">
                  {typeof bicycle.type === 'object' ? bicycle.type.name : 'Type not specified'}
                  </p>
               </div>
               <div className="flex items-center justify-between mb-3">
                  <div>
                  <span className="text-primary-600 font-bold text-lg">
                     {bicycle.discountPrice ? bicycle.discountPrice.toLocaleString() : bicycle.price.toLocaleString()} $
                  </span>
                  {bicycle.discountPrice && (
                     <span className="ml-2 text-sm text-gray-500 line-through">
                        {bicycle.price.toLocaleString()} $
                     </span>
                  )}
                  </div>
                  {bicycle.ratingSummary && (
                  <div className="flex items-center">
                     <Star size={16} className="text-yellow-400 fill-current" />
                     <span className="ml-1 text-sm text-gray-600">
                        {bicycle.ratingSummary.averageRating.toFixed(1)} ({bicycle.ratingSummary.totalReviews})
                     </span>
                  </div>
                  )}
               </div>
               <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center">
                  <Package size={16} className="text-gray-500 mr-2" />
                  <span className={`${bicycle.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {bicycle.stock > 0 ? `In stock: ${bicycle.stock}` : 'Out of stock'}
                  </span>
                  </div>
                  {bicycle.specifications?.color && (
                  <span className="text-gray-600">{bicycle.specifications.color}</span>
                  )}
               </div>
               <div className="flex space-x-2">
                  <button
                  onClick={() => toggleActive(bicycle._id, bicycle.isActive)}
                  className={`flex-1 py-1 rounded-md transition-colors text-sm ${bicycle.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                  >
                  {bicycle.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                  onClick={() => handleEdit(bicycle)}
                  className="flex-1 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                  <Edit size={16} className="mx-auto" />
                  </button>
                  <button
                  onClick={() => handleDelete(bicycle._id)}
                  className="flex-1 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
                  >
                  <Trash2 size={16} className="mx-auto" />
                  </button>
               </div>
            </div>
            </div>
         ))
      ) : (
         <div className="col-span-full text-center py-8 text-gray-500">
            {bicycles === undefined ? 'Loading...' : 'No bicycles to display'}
         </div>
      )}
      </div>

      {bicycles.length === 0 && (
        <div className="text-center py-12">
          <Bike size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Bicycles not found
          </h3>
          <p className="text-gray-600">
            Add the first bicycle by clicking the "Add bicycle" button
          </p>
        </div>
      )}
    </div>
  )
}

export default BicyclesAdminPage