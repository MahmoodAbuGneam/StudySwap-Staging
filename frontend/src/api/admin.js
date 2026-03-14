import client from './client'

export const getUsers = (params) => client.get('/admin/users', { params }).then(r => r.data)
export const updateUserStatus = (userId, status) => client.patch(`/admin/users/${userId}/status`, { status }).then(r => r.data)
export const deleteUser = (userId) => client.delete(`/admin/users/${userId}`).then(r => r.data)

export const getCategories = () => client.get('/admin/categories').then(r => r.data)
export const addCategory = (name) => client.post('/admin/categories', { name }).then(r => r.data)
export const deleteCategory = (name) => client.delete(`/admin/categories/${encodeURIComponent(name)}`).then(r => r.data)

export const getSwaps = (params) => client.get('/admin/swaps', { params }).then(r => r.data)

export const getRatings = () => client.get('/admin/ratings').then(r => r.data)
export const deleteRating = (ratingId) => client.delete(`/admin/ratings/${ratingId}`).then(r => r.data)
