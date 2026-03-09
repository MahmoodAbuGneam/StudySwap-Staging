import client from './client'

export const createSwap = (data) =>
  client.post('/swaps', data).then((r) => r.data)

export const listSwaps = () =>
  client.get('/swaps').then((r) => r.data)

export const acceptSwap = (id) =>
  client.put(`/swaps/${id}/accept`).then((r) => r.data)

export const rejectSwap = (id) =>
  client.put(`/swaps/${id}/reject`).then((r) => r.data)

export const confirmSwap = (id) =>
  client.put(`/swaps/${id}/confirm`).then((r) => r.data)

export const cancelSwap = (id) =>
  client.put(`/swaps/${id}/cancel`).then((r) => r.data)
