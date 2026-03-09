import client from './client'

export const addFavorite = (userId) =>
  client.post(`/favorites/${userId}`).then((r) => r.data)

export const removeFavorite = (userId) =>
  client.delete(`/favorites/${userId}`).then((r) => r.data)

export const listFavorites = () =>
  client.get('/favorites').then((r) => r.data)
