import client from './client'

export const submitRating = (data) =>
  client.post('/ratings', data).then((r) => r.data)

export const getUserRatings = (userId) =>
  client.get(`/ratings/user/${userId}`).then((r) => r.data)
