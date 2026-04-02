import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

const Admin = () => {
  const { token, user } = useAuth()
  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [variantProduct, setVariantProduct] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const [productForm, setProductForm] = useState({
    name: '', category: 'electronics', price: '', originalPrice: '',
    rating: '4.0', reviews: '0', image: '', description: '', inStock: true, badge: ''
  })

  const [categoryForm, setCategoryForm] = useState({
    name: '', image: ''
  })

  const [variantForm, setVariantForm] = useState({
    name: '', price: '', stock: '0', image: ''
  })

  const categoryOptions = ['electronics', 'fashion', 'home-kitchen', 'beauty', 'sports', 'books', 'toys', 'grocery']

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, ordRes, catRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/orders'),
        axios.get('/api/admin/categories')
      ])
      setProducts(prodRes.data)
      setOrders(ordRes.data)
      setCategories(catRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const downloadSample = async () => {
    try {
      const response = await axios.get('/api/admin/products/sample', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'sample_products.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to download sample file')
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post('/api/admin/products/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      alert(res.data.message)
      fetchData()
    } catch (err) {
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        name: product.name, category: product.category,
        price: product.price.toString(), originalPrice: product.originalPrice.toString(),
        rating: product.rating.toString(), reviews: product.reviews.toString(),
        image: product.image, description: product.description,
        inStock: product.inStock, badge: product.badge || ''
      })
    } else {
      setEditingProduct(null)
      setProductForm({
        name: '', category: 'electronics', price: '', originalPrice: '',
        rating: '4.0', reviews: '0', image: '', description: '', inStock: true, badge: ''
      })
    }
    setShowProductModal(true)
  }

  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat)
      setCategoryForm({ name: cat.name, image: cat.image })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: '', image: '' })
    }
    setShowCategoryModal(true)
  }

  const openVariantModal = (product) => {
    setVariantProduct(product)
    setEditingVariant(null)
    setVariantForm({ name: '', price: '', stock: '0', image: '' })
    setShowVariantModal(true)
  }

  const openEditVariant = (variant) => {
    setEditingVariant(variant)
    setVariantForm({
      name: variant.name,
      price: variant.price.toString(),
      stock: variant.stock.toString(),
      image: variant.image || ''
    })
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.id}`, productForm)
      } else {
        await axios.post('/api/products', productForm)
      }
      setShowProductModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to save product')
    }
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await axios.put(`/api/admin/categories/${editingCategory.id}`, categoryForm)
      } else {
        await axios.post('/api/admin/categories', categoryForm)
      }
      setShowCategoryModal(false)
      fetchData()
    } catch (err) {
      alert('Failed to save category')
    }
  }

  const handleVariantSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingVariant) {
        await axios.put(`/api/products/${variantProduct.id}/variants/${editingVariant.id}`, variantForm)
      } else {
        await axios.post(`/api/products/${variantProduct.id}/variants`, variantForm)
      }
      setEditingVariant(null)
      setVariantForm({ name: '', price: '', stock: '0', image: '' })
      fetchData()
    } catch (err) {
      alert('Failed to save variant')
    }
  }

  const deleteVariant = async (variantId) => {
    if (!confirm('Delete this variant?')) return
    try {
      await axios.delete(`/api/products/${variantProduct.id}/variants/${variantId}`)
      fetchData()
    } catch (err) {
      alert('Failed to delete variant')
    }
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await axios.delete(`/api/products/${id}`)
      fetchData()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return
    try {
      await axios.delete(`/api/admin/categories/${id}`)
      fetchData()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  if (!token) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h1>Admin Panel</h1>
        <p>Please login to access admin panel.</p>
        <Link to="/login" className="btn btn-primary">Login</Link>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ padding: '40px 0', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '30px' }}>Admin Panel</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '1px solid #DDD', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {['products', 'categories', 'orders'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: '20px',
              background: activeTab === tab ? '#FF9900' : '#F3F3F3',
              color: activeTab === tab ? '#232F3E' : '#111', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize'
            }}>
            {tab} {tab === 'products' && `(${products.length})`} {tab === 'categories' && `(${categories.length})`} {tab === 'orders' && `(${orders.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2>Products</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={downloadSample} className="btn btn-outline">Download Sample XLS</button>
              <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                {uploading ? 'Uploading...' : 'Bulk Upload XLS'}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button onClick={() => openProductModal()} className="btn btn-primary">+ Add Product</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #DDD' }}>
              <thead>
                <tr style={{ background: '#F3F3F3' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Image</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Variants</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Stock</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>
                      <img src={p.image} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>{p.name}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>{p.category}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>₹{p.price.toLocaleString()}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>
                      <span style={{ background: '#E3F2FD', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {p.variants?.length || 0} variants
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>
                      <span style={{ color: p.inStock ? '#007600' : '#D62626' }}>{p.inStock ? 'In Stock' : 'Out'}</span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>
                      <button onClick={() => openVariantModal(p)} style={{ marginRight: '5px', color: '#007185', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Variants</button>
                      <button onClick={() => openProductModal(p)} style={{ marginRight: '5px', color: '#007185', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => deleteProduct(p.id)} style={{ color: '#D62626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Categories</h2>
            <button onClick={() => openCategoryModal()} className="btn btn-primary">+ Add Category</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ background: 'white', border: '1px solid #DDD', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
                <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '15px' }} />
                <h3 style={{ marginBottom: '10px' }}>{cat.name}</h3>
                <p style={{ color: '#666', fontSize: '12px', marginBottom: '15px' }}>/{cat.slug}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => openCategoryModal(cat)} className="btn btn-outline" style={{ padding: '5px 15px', fontSize: '12px' }}>Edit</button>
                  <button onClick={() => deleteCategory(cat.id)} className="btn btn-outline" style={{ padding: '5px 15px', fontSize: '12px', color: '#D62626' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2>Orders</h2>
          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #DDD' }}>
                <thead>
                  <tr style={{ background: '#F3F3F3' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Order ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Items</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Total</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>#{o.id}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>{o.items.length} items</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>₹{o.totalAmount.toLocaleString()}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #DDD', color: '#007600' }}>{o.status}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid #DDD' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showProductModal && (
        <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} onClose={() => setShowProductModal(false)}>
          <form onSubmit={handleProductSubmit}>
            <div className="form-group">
              <label>Product Name *</label>
              <input type="text" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <select value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} required>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price (₹) *</label>
                <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Original Price (₹)</label>
                <input type="number" value={productForm.originalPrice} onChange={e => setProductForm({...productForm, originalPrice: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Rating</label>
                <input type="number" value={productForm.rating} onChange={e => setProductForm({...productForm, rating: e.target.value})} step="0.1" min="0" max="5" />
              </div>
              <div className="form-group">
                <label>Reviews</label>
                <input type="number" value={productForm.reviews} onChange={e => setProductForm({...productForm, reviews: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input type="url" value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows="3" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Badge</label>
                <input type="text" value={productForm.badge} onChange={e => setProductForm({...productForm, badge: e.target.value})} placeholder="e.g. Best Seller" />
              </div>
              <div className="form-group">
                <label>In Stock</label>
                <input type="checkbox" checked={productForm.inStock} onChange={e => setProductForm({...productForm, inStock: e.target.checked})} style={{ width: 'auto' }} /> Yes
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingProduct ? 'Update' : 'Add'}</button>
              <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {showCategoryModal && (
        <Modal title={editingCategory ? 'Edit Category' : 'Add Category'} onClose={() => setShowCategoryModal(false)}>
          <form onSubmit={handleCategorySubmit}>
            <div className="form-group">
              <label>Category Name *</label>
              <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} required placeholder="e.g. Electronics" />
            </div>
            <div className="form-group">
              <label>Image URL</label>
              <input type="url" value={categoryForm.image} onChange={e => setCategoryForm({...categoryForm, image: e.target.value})} placeholder="https://..." />
            </div>
            {categoryForm.image && (
              <div style={{ marginBottom: '15px' }}>
                <img src={categoryForm.image} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingCategory ? 'Update' : 'Add'}</button>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {showVariantModal && variantProduct && (
        <Modal title={`Variants: ${variantProduct.name}`} onClose={() => setShowVariantModal(false)} wide>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>{editingVariant ? 'Edit Variant' : 'Add New Variant'}</h3>
            <form onSubmit={handleVariantSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>Variant Name *</label>
                <input type="text" value={variantForm.name} onChange={e => setVariantForm({...variantForm, name: e.target.value})} required placeholder="e.g. Size - M, Color - Red" style={{ width: '100%' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>Price (₹) *</label>
                <input type="number" value={variantForm.price} onChange={e => setVariantForm({...variantForm, price: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>Stock</label>
                <input type="number" value={variantForm.stock} onChange={e => setVariantForm({...variantForm, stock: e.target.value})} style={{ width: '100%' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '12px' }}>Image URL</label>
                <input type="url" value={variantForm.image} onChange={e => setVariantForm({...variantForm, image: e.target.value})} style={{ width: '100%' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 15px' }}>
                {editingVariant ? 'Update' : 'Add'}
              </button>
            </form>
            {editingVariant && (
              <button type="button" onClick={() => { setEditingVariant(null); setVariantForm({ name: '', price: '', stock: '0', image: '' }) }} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007185', cursor: 'pointer' }}>
                Cancel Edit
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid #DDD', paddingTop: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Existing Variants ({variantProduct.variants?.length || 0})</h3>
            {(!variantProduct.variants || variantProduct.variants.length === 0) ? (
              <p style={{ color: '#666' }}>No variants added yet.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3F3F3' }}>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Name</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Price</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Stock</th>
                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #DDD' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variantProduct.variants.map(v => (
                    <tr key={v.id}>
                      <td style={{ padding: '10px', borderBottom: '1px solid #DDD' }}>{v.name}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #DDD' }}>₹{v.price.toLocaleString()}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #DDD' }}>{v.stock}</td>
                      <td style={{ padding: '10px', borderBottom: '1px solid #DDD' }}>
                        <button onClick={() => openEditVariant(v)} style={{ marginRight: '10px', color: '#007185', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => deleteVariant(v.id)} style={{ color: '#D62626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

const Modal = ({ title, children, onClose, wide }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  }}>
    <div style={{ background: 'white', padding: '30px', borderRadius: '8px', width: wide ? '800px' : '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
      </div>
      {children}
    </div>
  </div>
)

export default Admin
